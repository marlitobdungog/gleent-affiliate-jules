#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

CONFIG_FILE="${DEPLOY_ENV_FILE:-deploy.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

# Hardcode the default image tag to deploy here.
DEPLOY_TAG="${DEPLOY_TAG:-v1.2.0}"

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  --tag TAG                 Deploy images built with TAG.
  --backend-image IMAGE     Deploy this exact backend image.
  --frontend-image IMAGE    Deploy this exact frontend image.
  -h, --help               Show this help.

Environment:
  DEPLOY_TAG                Default image tag to deploy.
  TAG or IMAGE_TAG          Image tag override.
  BACKEND_IMAGE             Exact backend image to deploy.
  FRONTEND_IMAGE            Exact frontend image to deploy.
EOF
}

CLI_TAG=""
CLI_BACKEND_IMAGE=""
CLI_FRONTEND_IMAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      if [[ -z "${2:-}" ]]; then
        echo "--tag requires a value." >&2
        exit 1
      fi
      CLI_TAG="${2:-}"
      shift 2
      ;;
    --backend-image)
      if [[ -z "${2:-}" ]]; then
        echo "--backend-image requires a value." >&2
        exit 1
      fi
      CLI_BACKEND_IMAGE="${2:-}"
      shift 2
      ;;
    --frontend-image)
      if [[ -z "${2:-}" ]]; then
        echo "--frontend-image requires a value." >&2
        exit 1
      fi
      CLI_FRONTEND_IMAGE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

command -v gcloud >/dev/null 2>&1 || {
  echo "gcloud is required." >&2
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
APP_URL="${APP_URL:-https://affiliate.sprinthrapis.com}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-https://affiliate.gleent.com}"
LEGACY_FRONTEND_ORIGIN="${LEGACY_FRONTEND_ORIGIN:-https://gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app}"
ALT_FRONTEND_ORIGIN="${ALT_FRONTEND_ORIGIN:-https://gleent-affiliate-frontend-lijnomv2zq-as.a.run.app}"
FRONTEND_HOST="${FRONTEND_ORIGIN#http://}"
FRONTEND_HOST="${FRONTEND_HOST#https://}"
LEGACY_FRONTEND_HOST="${LEGACY_FRONTEND_ORIGIN#http://}"
LEGACY_FRONTEND_HOST="${LEGACY_FRONTEND_HOST#https://}"
ALT_FRONTEND_HOST="${ALT_FRONTEND_ORIGIN#http://}"
ALT_FRONTEND_HOST="${ALT_FRONTEND_HOST#https://}"

if [[ -z "$APP_KEY" && -f backend/.env ]]; then
  APP_KEY="$(grep -E '^APP_KEY=' backend/.env | head -n 1 | cut -d= -f2-)"
fi

for required_var in APP_KEY DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD; do
  if [[ -z "${!required_var}" ]]; then
    echo "Set $required_var before running deploy.sh." >&2
    exit 1
  fi
done

TAG="${CLI_TAG:-${IMAGE_TAG:-${TAG:-$DEPLOY_TAG}}}"
AR_HOST="${REGION}-docker.pkg.dev"
IMAGE_PREFIX="${AR_HOST}/${PROJECT_ID}/${REPOSITORY}"
BACKEND_IMAGE="${CLI_BACKEND_IMAGE:-${BACKEND_IMAGE:-${IMAGE_PREFIX}/${BACKEND_SERVICE}:${TAG}}}"
FRONTEND_IMAGE="${CLI_FRONTEND_IMAGE:-${FRONTEND_IMAGE:-${IMAGE_PREFIX}/${FRONTEND_SERVICE}:${TAG}}}"

echo "Using project $PROJECT_ID in region $REGION..."
echo "Backend image:  $BACKEND_IMAGE"
echo "Frontend image: $FRONTEND_IMAGE"

BACKEND_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-backend-env.XXXXXX")"
BACKEND_ENV_YAML="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-backend-env-yaml.XXXXXX")"
trap 'rm -f "$BACKEND_ENV_FILE" "$BACKEND_ENV_YAML"' EXIT

cat > "$BACKEND_ENV_FILE" <<EOF
APP_ENV=production
APP_DEBUG=false
APP_URL=$APP_URL
FRONTEND_URL=$FRONTEND_ORIGIN
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
SANCTUM_STATEFUL_DOMAINS=${FRONTEND_HOST},${LEGACY_FRONTEND_HOST},${ALT_FRONTEND_HOST},localhost,localhost:5173,localhost:8089,127.0.0.1,127.0.0.1:5173,127.0.0.1:8089
CORS_ALLOWED_ORIGINS=${FRONTEND_ORIGIN},${LEGACY_FRONTEND_ORIGIN},${ALT_FRONTEND_ORIGIN},http://localhost:5173,http://localhost:8089
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
APP_URL: "$APP_URL"
FRONTEND_URL: "$FRONTEND_ORIGIN"
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
SANCTUM_STATEFUL_DOMAINS: "$FRONTEND_HOST,$LEGACY_FRONTEND_HOST,$ALT_FRONTEND_HOST,localhost,localhost:5173,localhost:8089,127.0.0.1,127.0.0.1:5173,127.0.0.1:8089"
CORS_ALLOWED_ORIGINS: "$FRONTEND_ORIGIN,$LEGACY_FRONTEND_ORIGIN,$ALT_FRONTEND_ORIGIN,http://localhost:5173,http://localhost:8089"
CORS_ALLOWED_ORIGINS_PATTERNS: "#^https://.*\\.a\\.run\\.app$#,#^http://localhost(:\\d+)?$#"
LOG_LEVEL: "info"
EOF
sed -i.bak 's|\$APP_URL|'"$APP_URL"'|g; s|\$FRONTEND_ORIGIN|'"$FRONTEND_ORIGIN"'|g; s|\$FRONTEND_HOST|'"$FRONTEND_HOST"'|g; s|\$LEGACY_FRONTEND_ORIGIN|'"$LEGACY_FRONTEND_ORIGIN"'|g; s|\$LEGACY_FRONTEND_HOST|'"$LEGACY_FRONTEND_HOST"'|g; s|\$ALT_FRONTEND_ORIGIN|'"$ALT_FRONTEND_ORIGIN"'|g; s|\$ALT_FRONTEND_HOST|'"$ALT_FRONTEND_HOST"'|g; s|\$APP_KEY|'"${APP_KEY//|\\|}"'|g; s|\$DB_HOST|'"$DB_HOST"'|g; s|\$DB_PORT|'"$DB_PORT"'|g; s|\$DB_DATABASE|'"$DB_DATABASE"'|g; s|\$DB_USERNAME|'"$DB_USERNAME"'|g; s|\$DB_PASSWORD|'"${DB_PASSWORD//|\\|}"'|g' "$BACKEND_ENV_YAML"
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
