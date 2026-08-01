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
APP_KEY="${APP_KEY:-}"
DB_HOST="${DB_HOST:-10.148.0.27}"
DB_PORT="${DB_PORT:-3310}"
DB_DATABASE="${DB_DATABASE:-}"
DB_USERNAME="${DB_USERNAME:-}"
DB_PASSWORD="${DB_PASSWORD:-}"
APP_URL="${APP_URL:-http://localhost}"

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
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:8089,127.0.0.1,127.0.0.1:5173,127.0.0.1:8089,*.a.run.app
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8089
CORS_ALLOWED_ORIGINS_PATTERNS=#^https://.*\\.a\\.run\\.app$#,#^http://localhost(:\\d+)?$#
LOG_LEVEL=info
EOF

> "$BACKEND_ENV_YAML"
while IFS='=' read -r key value; do
  [[ -z "$key" ]] && continue
  value_escaped="${value//\"/\\\"}"
  echo "${key}: \"${value_escaped}\"" >> "$BACKEND_ENV_YAML"
done < "$BACKEND_ENV_FILE"

echo "Building backend image..."
docker build --platform=linux/amd64 -f backend/docker/php/Dockerfile -t "$BACKEND_IMAGE" backend
docker push "$BACKEND_IMAGE"

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
  --command=php \
  --args=artisan,serve,--host=0.0.0.0,--port=8080 \
  --env-vars-file="$BACKEND_ENV_YAML" >/dev/null

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Updating backend APP_URL to $BACKEND_URL..."
gcloud run services update "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --update-env-vars "APP_URL=${BACKEND_URL}" >/dev/null

echo "Running database migrations..."
docker run --rm \
  --platform=linux/amd64 \
  -e APP_ENV=production \
  -e APP_DEBUG=false \
  -e APP_URL="$BACKEND_URL" \
  -e APP_KEY="$APP_KEY" \
  -e DB_CONNECTION=mysql \
  -e DB_HOST="$DB_HOST" \
  -e DB_PORT="$DB_PORT" \
  -e DB_DATABASE="$DB_DATABASE" \
  -e DB_USERNAME="$DB_USERNAME" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e SESSION_DRIVER=database \
  -e SESSION_SECURE_COOKIE=true \
  -e SESSION_SAME_SITE=lax \
  "$BACKEND_IMAGE" php artisan migrate --force --no-interaction

echo "Building frontend image with API base $BACKEND_URL..."
docker build \
  --platform=linux/amd64 \
  --build-arg VITE_API_BASE_URL="$BACKEND_URL" \
  -f docker/frontend/Dockerfile \
  -t "$FRONTEND_IMAGE" .
docker push "$FRONTEND_IMAGE"

echo "Deploying frontend service..."
gcloud run deploy "$FRONTEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --image "$FRONTEND_IMAGE" \
  --port=80 \
  --cpu=1 \
  --memory=512Mi >/dev/null

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Deployed:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
