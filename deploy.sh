#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

CONFIG_FILE="${DEPLOY_ENV_FILE:-deploy.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

command -v gcloud >/dev/null 2>&1 || {
  echo "gcloud is required." >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || {
  echo "docker is required." >&2
  exit 1
}

PROJECT_ID="${GCP_PROJECT_ID:-${PROJECT_ID:-myassistant-440206}}"
REGION="${GCP_REGION:-${REGION:-asia-southeast1}}"
ZONE="${GCP_ZONE:-${ZONE:-}}"
REPOSITORY="${GCP_ARTIFACT_REPOSITORY:-${REPO:-docker-repo}}"
BACKEND_SERVICE="${GCP_BACKEND_SERVICE:-${BACKEND_SERVICE:-gleent-affiliate-backend}}"
FRONTEND_SERVICE="${GCP_FRONTEND_SERVICE:-${FRONTEND_SERVICE:-gleent-affiliate-frontend}}"
SERVICE_ACCOUNT="cloud-run@${PROJECT_ID}.iam.gserviceaccount.com"
APP_KEY="${APP_KEY:-}"
DB_HOST="${DB_HOST:-10.148.0.27}"
DB_PORT="${DB_PORT:-3310}"
DB_DATABASE="${DB_DATABASE:-}"
DB_USERNAME="${DB_USERNAME:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
APP_URL="${APP_URL:-http://localhost}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-https://gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app}"
ALT_FRONTEND_ORIGIN="${ALT_FRONTEND_ORIGIN:-https://gleent-affiliate-frontend-lijnomv2zq-as.a.run.app}"
FRONTEND_HOST="${FRONTEND_ORIGIN#http://}"
FRONTEND_HOST="${FRONTEND_HOST#https://}"

if [[ -z "$APP_KEY" && -f backend/.env ]]; then
  APP_KEY="$(grep -E '^APP_KEY=' backend/.env | head -n 1 | cut -d= -f2-)"
fi

for required_var in APP_KEY DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD; do
  if [[ -z "${!required_var}" ]]; then
    echo "Set $required_var before running deploy.sh." >&2
    exit 1
  fi
done

TAG="${GIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
AR_HOST="${REGION}-docker.pkg.dev"
IMAGE_PREFIX="${AR_HOST}/${PROJECT_ID}/${REPOSITORY}"
BACKEND_IMAGE="${IMAGE_PREFIX}/${BACKEND_SERVICE}:${TAG}"
FRONTEND_IMAGE="${IMAGE_PREFIX}/${FRONTEND_SERVICE}:${TAG}"

echo "Using project $PROJECT_ID in region $REGION..."
gcloud auth configure-docker "$AR_HOST" --quiet >/dev/null

BACKEND_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-backend-env.XXXXXX")"
BACKEND_ENV_YAML="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-backend-env-yaml.XXXXXX")"
trap 'rm -f "$BACKEND_ENV_FILE" "$BACKEND_ENV_YAML"' EXIT

cat > "$BACKEND_ENV_FILE" <<EOF
APP_ENV=production
APP_DEBUG=false
APP_URL=$APP_URL
APP_KEY=$APP_KEY
DB_CONNECTION=mysql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_DATABASE=$DB_DATABASE
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SANCTUM_STATEFUL_DOMAINS=${FRONTEND_HOST},gleent-affiliate-frontend-lijnomv2zq-as.a.run.app,localhost,localhost:5173,localhost:8089,127.0.0.1,127.0.0.1:5173,127.0.0.1:8089
CORS_ALLOWED_ORIGINS=${FRONTEND_ORIGIN},${ALT_FRONTEND_ORIGIN},http://localhost:5173,http://localhost:8089
CORS_ALLOWED_ORIGINS_PATTERNS=#^https://.*\\.a\\.run\\.app$#,#^http://localhost(:\\d+)?$#
LOG_LEVEL=info
EOF

> "$BACKEND_ENV_YAML"
while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  value_escaped="${value//\\/\\\\}"
  value_escaped="${value_escaped//\"/\\\"}"
  echo "${key}: \"${value_escaped}\"" >> "$BACKEND_ENV_YAML"
done < "$BACKEND_ENV_FILE"

echo "Building and pushing backend image..."
docker buildx build \
  --platform linux/amd64 \
  -f backend/docker/php/Dockerfile \
  -t "$BACKEND_IMAGE" \
  --push \
  backend

echo "Deploying backend service..."
gcloud run deploy "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --image "$BACKEND_IMAGE" \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --service-account="$SERVICE_ACCOUNT" \
  --vpc-connector=default-run-connector \
  --vpc-egress=all-traffic \
  --command=php \
  --args=artisan,serve,--host=0.0.0.0,--port=8080 \
  --env-vars-file="$BACKEND_ENV_YAML" >/dev/null

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

# Normalize to numeric format for consistency
if [[ "$BACKEND_URL" == *".a.run.app" ]]; then
  BACKEND_URL="https://gleent-affiliate-backend-1083135128051.${REGION}.run.app"
fi

echo "Backend URL: $BACKEND_URL"
cat > "$BACKEND_ENV_YAML" <<'EOF'
APP_URL: "$BACKEND_URL"
APP_ENV: "production"
APP_DEBUG: "false"
APP_KEY: "$APP_KEY"
DB_CONNECTION: "mysql"
DB_HOST: "$DB_HOST"
DB_PORT: "$DB_PORT"
DB_DATABASE: "$DB_DATABASE"
DB_USERNAME: "$DB_USERNAME"
DB_PASSWORD: "$DB_PASSWORD"
SESSION_DRIVER: "database"
SESSION_SECURE_COOKIE: "true"
SESSION_SAME_SITE: "none"
SANCTUM_STATEFUL_DOMAINS: "gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app,gleent-affiliate-frontend-lijnomv2zq-as.a.run.app,localhost,localhost:5173,localhost:8089,127.0.0.1,127.0.0.1:5173,127.0.0.1:8089"
CORS_ALLOWED_ORIGINS: "https://gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app,https://gleent-affiliate-frontend-lijnomv2zq-as.a.run.app,http://localhost:5173,http://localhost:8089"
CORS_ALLOWED_ORIGINS_PATTERNS: "#^https://.*\\.a\\.run\\.app$#,#^http://localhost(:\\d+)?$#"
LOG_LEVEL: "info"
EOF
sed -i.bak 's|\$BACKEND_URL|'"$BACKEND_URL"'|g; s|\$APP_KEY|'"${APP_KEY//|\\|}"'|g; s|\$DB_HOST|'"$DB_HOST"'|g; s|\$DB_PORT|'"$DB_PORT"'|g; s|\$DB_DATABASE|'"$DB_DATABASE"'|g; s|\$DB_USERNAME|'"$DB_USERNAME"'|g; s|\$DB_PASSWORD|'"${DB_PASSWORD//|\\|}"'|g' "$BACKEND_ENV_YAML"
rm -f "$BACKEND_ENV_YAML.bak"
gcloud run services update "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --env-vars-file="$BACKEND_ENV_YAML" >/dev/null

MIGRATION_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-migrate-env.XXXXXX")"
MIGRATION_ENV_YAML="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-migrate-env-yaml.XXXXXX")"
trap 'rm -f "$BACKEND_ENV_FILE" "$BACKEND_ENV_YAML" "$MIGRATION_ENV_FILE" "$MIGRATION_ENV_YAML"' EXIT

cat > "$MIGRATION_ENV_FILE" <<EOF
APP_ENV=production
APP_DEBUG=false
APP_URL=$BACKEND_URL
APP_KEY=$APP_KEY
DB_CONNECTION=mysql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_DATABASE=$DB_DATABASE
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
EOF

> "$MIGRATION_ENV_YAML"
while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  value_escaped="${value//\\/\\\\}"
  value_escaped="${value_escaped//\"/\\\"}"
  echo "${key}: \"${value_escaped}\"" >> "$MIGRATION_ENV_YAML"
done < "$MIGRATION_ENV_FILE"

echo "Running database migrations in Cloud Run..."
gcloud run jobs deploy "${BACKEND_SERVICE}-migrate" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "$BACKEND_IMAGE" \
  --service-account="$SERVICE_ACCOUNT" \
  --vpc-connector=default-run-connector \
  --vpc-egress=all-traffic \
  --cpu=1 \
  --memory=512Mi \
  --tasks=1 \
  --max-retries=0 \
  --command=sh \
  --args=-lc,'i=0; until MYSQL_PWD="$DB_PASSWORD" mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" --silent; do i=$((i + 1)); if [ "$i" -ge 12 ]; then echo "Database not reachable at $DB_HOST:$DB_PORT after $i attempts." >&2; exit 1; fi; echo "Waiting for database at $DB_HOST:$DB_PORT ($i/12)..."; sleep 5; done; php artisan migrate --force --no-interaction' \
  --env-vars-file="$MIGRATION_ENV_YAML" \
  --execute-now \
  --wait >/dev/null

echo "Building and pushing frontend image with backend proxy $BACKEND_URL..."
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="" \
  --build-arg BACKEND_URL="$BACKEND_URL" \
  -f docker/frontend/Dockerfile \
  -t "$FRONTEND_IMAGE" \
  --push \
  .

echo "Deploying frontend service..."
gcloud run deploy "$FRONTEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --image "$FRONTEND_IMAGE" \
  --port=80 \
  --cpu=1 \
  --memory=512Mi \
  --service-account="$SERVICE_ACCOUNT" \
  --vpc-connector=default-run-connector \
  --vpc-egress=all-traffic >/dev/null

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Deployed:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
