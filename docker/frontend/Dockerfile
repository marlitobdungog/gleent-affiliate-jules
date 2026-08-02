FROM node:22-alpine AS build

ARG VITE_API_BASE_URL=
ARG BACKEND_URL=http://localhost:8000

WORKDIR /app

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ARG BACKEND_URL=http://localhost:8000

COPY docker/frontend/default.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
