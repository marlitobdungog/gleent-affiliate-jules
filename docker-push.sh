#!/bin/sh
set -eu

PROJECT_ID="myassistant-440206"
REGION="asia-southeast1"
REPOSITORY="docker-repo"
APP_NAME="gleent-affiliate"
VERSION="$(cat VERSION)"
REGISTRY="${REGION}-docker.pkg.dev"
IMAGE_PREFIX="${REGISTRY}/${PROJECT_ID}/${REPOSITORY}"

if ! gcloud auth print-identity-token >/dev/null 2>&1; then
  gcloud auth login
fi
gcloud auth configure-docker "${REGISTRY}" --quiet

docker buildx build --platform linux/amd64 \
  -f backend/docker/php/Dockerfile \
  -t "${IMAGE_PREFIX}/${APP_NAME}-backend:${VERSION}" \
  --push backend

docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL="" \
  --build-arg BACKEND_URL="https://gleent-affiliate-backend-1083135128051.asia-southeast1.run.app" \
  -f docker/frontend/Dockerfile \
  -t "${IMAGE_PREFIX}/${APP_NAME}-frontend:${VERSION}" \
  --push .

docker buildx build --platform linux/amd64 \
  -f backend/docker/nginx/Dockerfile \
  -t "${IMAGE_PREFIX}/${APP_NAME}-web:${VERSION}" \
  --push backend
