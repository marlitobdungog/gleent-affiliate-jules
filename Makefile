SHELL := /bin/bash

-include deploy.env

TAG ?= v1.2.0

GCP_PROJECT_ID ?= $(if $(PROJECT_ID),$(PROJECT_ID),myassistant-440206)
GCP_REGION ?= $(if $(REGION),$(REGION),asia-southeast1)
GCP_ARTIFACT_REPOSITORY ?= $(if $(REPO),$(REPO),docker-repo)
GCP_BACKEND_SERVICE ?= $(if $(BACKEND_SERVICE),$(BACKEND_SERVICE),gleent-affiliate-backend)
GCP_FRONTEND_SERVICE ?= $(if $(FRONTEND_SERVICE),$(FRONTEND_SERVICE),gleent-affiliate-frontend)

#BACKEND_URL := https://affiliate.sprinthrapis.com
BACKEND_URL := https://gleent-affiliate-backend-1083135128051.asia-southeast1.run.app

AR_HOST := $(GCP_REGION)-docker.pkg.dev
IMAGE_PREFIX := $(AR_HOST)/$(GCP_PROJECT_ID)/$(GCP_ARTIFACT_REPOSITORY)
BACKEND_IMAGE := $(IMAGE_PREFIX)/$(GCP_BACKEND_SERVICE):$(TAG)
FRONTEND_IMAGE := $(IMAGE_PREFIX)/$(GCP_FRONTEND_SERVICE):$(TAG)
UNAME_S := $(shell uname -s)

.PHONY: build build-mac push print-images docker-auth ensure-supported-build-host ensure-macos release

build: ensure-supported-build-host
ifeq ($(UNAME_S),Darwin)
	@echo "Building linux/amd64 backend image from macOS: $(BACKEND_IMAGE)"
	docker buildx build --platform linux/amd64 -f backend/docker/php/Dockerfile -t "$(BACKEND_IMAGE)" --load backend
	@echo "Building linux/amd64 frontend image from macOS: $(FRONTEND_IMAGE)"
	docker buildx build --platform linux/amd64 --build-arg VITE_API_BASE_URL="" --build-arg BACKEND_URL="$(BACKEND_URL)" -f docker/frontend/Dockerfile -t "$(FRONTEND_IMAGE)" --load .
else
	@echo "Building backend image: $(BACKEND_IMAGE)"
	docker build -f backend/docker/php/Dockerfile -t "$(BACKEND_IMAGE)" backend
	@echo "Building frontend image: $(FRONTEND_IMAGE)"
	docker build --build-arg VITE_API_BASE_URL="" --build-arg BACKEND_URL="$(BACKEND_URL)" -f docker/frontend/Dockerfile -t "$(FRONTEND_IMAGE)" .
endif
	@$(MAKE) --no-print-directory print-images

build-mac: ensure-macos
	@echo "Building linux/amd64 backend image from macOS: $(BACKEND_IMAGE)"
	docker buildx build --platform linux/amd64 -f backend/docker/php/Dockerfile -t "$(BACKEND_IMAGE)" --load backend
	@echo "Building linux/amd64 frontend image from macOS: $(FRONTEND_IMAGE)"
	docker buildx build --platform linux/amd64 --build-arg VITE_API_BASE_URL="" --build-arg BACKEND_URL="$(BACKEND_URL)" -f docker/frontend/Dockerfile -t "$(FRONTEND_IMAGE)" --load .
	@$(MAKE) --no-print-directory print-images

push: docker-auth
	@echo "Pushing backend image: $(BACKEND_IMAGE)"
	docker push "$(BACKEND_IMAGE)"
	@echo "Pushing frontend image: $(FRONTEND_IMAGE)"
	docker push "$(FRONTEND_IMAGE)"
	@$(MAKE) --no-print-directory print-images

print-images:
	@echo "TAG=$(TAG)"
	@echo "BACKEND_IMAGE=$(BACKEND_IMAGE)"
	@echo "FRONTEND_IMAGE=$(FRONTEND_IMAGE)"

docker-auth:
	gcloud auth configure-docker "$(AR_HOST)" --quiet

ensure-supported-build-host:
	@if [[ "$(UNAME_S)" != "Linux" && "$(UNAME_S)" != "Darwin" ]]; then \
		echo "make build supports Linux and macOS only."; \
		exit 1; \
	fi

ensure-macos:
	@if [[ "$(UNAME_S)" != "Darwin" ]]; then \
		echo "make build-mac is for macOS. Use 'make build' on Linux."; \
		exit 1; \
	fi

release:
	./docker-push.sh
	appctl app release --path .
