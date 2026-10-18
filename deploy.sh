#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Hardcode the default image tag to deploy here.
DEPLOY_TAG="${DEPLOY_TAG:-v1.3.3}"

CONFIG_FILE="${DEPLOY_ENV_FILE:-deploy.env}"
load_env_file() {
  local env_file="$1"
  local parsed_env

  parsed_env="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-deploy-env.XXXXXX")"
  if ! python3 - "$env_file" > "$parsed_env" <<'PY'
import re
import shlex
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as env_file:
    for line_number, raw_line in enumerate(env_file, 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, separator, value = line.partition("=")
        key = key.strip()
        if not separator or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            print(f"{path}:{line_number}: expected KEY=value", file=sys.stderr)
            sys.exit(1)

        value = value.strip()
        if value.startswith(("'", '"')):
            try:
                parsed = shlex.split("VALUE=" + value, posix=True)
            except ValueError:
                print(f"{path}:{line_number}: invalid quoted value for {key}", file=sys.stderr)
                sys.exit(1)
            if len(parsed) != 1 or not parsed[0].startswith("VALUE="):
                print(f"{path}:{line_number}: invalid quoted value for {key}", file=sys.stderr)
                sys.exit(1)
            value = parsed[0][len("VALUE="):]

        print(f"export {key}={shlex.quote(value)}")
PY
  then
    rm -f "$parsed_env"
    return 1
  fi

  # Values are shell-escaped by Python after parsing; the input file itself is never executed.
  # shellcheck disable=SC1090
  source "$parsed_env"
  rm -f "$parsed_env"
}

if [[ -f "$CONFIG_FILE" ]]; then
  load_env_file "$CONFIG_FILE"
fi

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  --tag TAG                 Build and deploy images with TAG.
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
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-https://affiliate.gleent.com}"
APP_URL="${APP_URL:-$FRONTEND_ORIGIN}"
AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-}"
AUTH_SERVICE_BROWSER_URL="${AUTH_SERVICE_BROWSER_URL:-$AUTH_SERVICE_URL}"
AUTH_SERVICE_INTERNAL_API_KEY="${AUTH_SERVICE_INTERNAL_API_KEY:-}"
AUTH_SERVICE_AFFILIATE_CLIENT_ID="${AUTH_SERVICE_AFFILIATE_CLIENT_ID:-}"
AUTH_SERVICE_AFFILIATE_CLIENT_SECRET="${AUTH_SERVICE_AFFILIATE_CLIENT_SECRET:-}"
AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID="${AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID:-}"
AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET="${AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET:-}"
AUTH_SERVICE_AFFILIATE_CALLBACK_URL="${AUTH_SERVICE_AFFILIATE_CALLBACK_URL:-${FRONTEND_ORIGIN%/}/api/sso/callback}"
AUTH_SERVICE_AFFILIATE_APPLICATION_CODE="${AUTH_SERVICE_AFFILIATE_APPLICATION_CODE:-affiliate}"
AUTH_SERVICE_AFFILIATE_ONBOARDING_APPLICATION_CODE="${AUTH_SERVICE_AFFILIATE_ONBOARDING_APPLICATION_CODE:-affiliate-onboarding}"
AUTH_SERVICE_TENANT_SLUG="${AUTH_SERVICE_TENANT_SLUG:-gleent}"
AUTH_SERVICE_CONNECT_TIMEOUT_SECONDS="${AUTH_SERVICE_CONNECT_TIMEOUT_SECONDS:-3}"
AUTH_SERVICE_TIMEOUT_SECONDS="${AUTH_SERVICE_TIMEOUT_SECONDS:-10}"
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

for required_var in APP_KEY DB_HOST DB_DATABASE DB_USERNAME DB_PASSWORD AUTH_SERVICE_URL AUTH_SERVICE_BROWSER_URL AUTH_SERVICE_INTERNAL_API_KEY AUTH_SERVICE_AFFILIATE_CLIENT_ID AUTH_SERVICE_AFFILIATE_CLIENT_SECRET AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET; do
  if [[ -z "${!required_var}" ]]; then
    echo "Set $required_var before running deploy.sh." >&2
    exit 1
  fi
done

TAG="${CLI_TAG:-${IMAGE_TAG:-${TAG:-$DEPLOY_TAG}}}"
AR_HOST="${REGION}-docker.pkg.dev"
IMAGE_PREFIX="${AR_HOST}/${PROJECT_ID}/${REPOSITORY}"
BACKEND_IMAGE_OVERRIDE="${CLI_BACKEND_IMAGE:-${BACKEND_IMAGE:-}}"
FRONTEND_IMAGE_OVERRIDE="${CLI_FRONTEND_IMAGE:-${FRONTEND_IMAGE:-}}"
BACKEND_IMAGE="${BACKEND_IMAGE_OVERRIDE:-${IMAGE_PREFIX}/${BACKEND_SERVICE}:${TAG}}"
FRONTEND_IMAGE="${FRONTEND_IMAGE_OVERRIDE:-${IMAGE_PREFIX}/${FRONTEND_SERVICE}:${TAG}}"
BUILD_BACKEND_IMAGE=true
BUILD_FRONTEND_IMAGE=true
[[ -z "$BACKEND_IMAGE_OVERRIDE" ]] || BUILD_BACKEND_IMAGE=false
[[ -z "$FRONTEND_IMAGE_OVERRIDE" ]] || BUILD_FRONTEND_IMAGE=false

echo "Using project $PROJECT_ID in region $REGION..."
echo "Backend image:  $BACKEND_IMAGE"
echo "Frontend image: $FRONTEND_IMAGE"

if [[ "$BUILD_BACKEND_IMAGE" == true || "$BUILD_FRONTEND_IMAGE" == true ]]; then
  command -v docker >/dev/null 2>&1 || {
    echo "docker is required to build deployment images. Use --backend-image and --frontend-image to deploy existing images." >&2
    exit 1
  }
  docker buildx version >/dev/null
  gcloud auth configure-docker "$AR_HOST" --quiet
fi

if [[ "$BUILD_BACKEND_IMAGE" == true ]]; then
  echo "Building and pushing backend image..."
  docker buildx build \
    --platform linux/amd64 \
    --file backend/docker/php/Dockerfile \
    --tag "$BACKEND_IMAGE" \
    --push \
    backend
fi

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
AUTH_SERVICE_URL=$AUTH_SERVICE_URL
AUTH_SERVICE_BROWSER_URL=$AUTH_SERVICE_BROWSER_URL
AUTH_SERVICE_INTERNAL_API_KEY=$AUTH_SERVICE_INTERNAL_API_KEY
AUTH_SERVICE_AFFILIATE_CLIENT_ID=$AUTH_SERVICE_AFFILIATE_CLIENT_ID
AUTH_SERVICE_AFFILIATE_CLIENT_SECRET=$AUTH_SERVICE_AFFILIATE_CLIENT_SECRET
AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID=$AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_ID
AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET=$AUTH_SERVICE_AFFILIATE_ONBOARDING_CLIENT_SECRET
AUTH_SERVICE_AFFILIATE_CALLBACK_URL=$AUTH_SERVICE_AFFILIATE_CALLBACK_URL
AUTH_SERVICE_AFFILIATE_APPLICATION_CODE=$AUTH_SERVICE_AFFILIATE_APPLICATION_CODE
AUTH_SERVICE_AFFILIATE_ONBOARDING_APPLICATION_CODE=$AUTH_SERVICE_AFFILIATE_ONBOARDING_APPLICATION_CODE
AUTH_SERVICE_TENANT_SLUG=$AUTH_SERVICE_TENANT_SLUG
AUTH_SERVICE_CONNECT_TIMEOUT_SECONDS=$AUTH_SERVICE_CONNECT_TIMEOUT_SECONDS
AUTH_SERVICE_TIMEOUT_SECONDS=$AUTH_SERVICE_TIMEOUT_SECONDS
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
  --vpc-egress=private-ranges-only \
  --command=php \
  --args=artisan,serve,--host=0.0.0.0,--port=8080 \
  --env-vars-file="$BACKEND_ENV_YAML" >/dev/null

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format='value(status.url)')"

echo "Backend URL: $BACKEND_URL"

MIGRATION_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-migrate-env.XXXXXX")"
MIGRATION_ENV_YAML="$(mktemp "${TMPDIR:-/tmp}/gleent-affiliate-migrate-env-yaml.XXXXXX")"
trap 'rm -f "$BACKEND_ENV_FILE" "$BACKEND_ENV_YAML" "$MIGRATION_ENV_FILE" "$MIGRATION_ENV_YAML"' EXIT

cat > "$MIGRATION_ENV_FILE" <<EOF
APP_ENV=production
APP_DEBUG=false
APP_URL=$FRONTEND_ORIGIN
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

if [[ "$BUILD_FRONTEND_IMAGE" == true ]]; then
  echo "Building and pushing frontend image..."
  docker buildx build \
    --platform linux/amd64 \
    --build-arg VITE_API_BASE_URL="" \
    --build-arg BACKEND_URL="$BACKEND_URL" \
    --file docker/frontend/Dockerfile \
    --tag "$FRONTEND_IMAGE" \
    --push \
    .
fi

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
