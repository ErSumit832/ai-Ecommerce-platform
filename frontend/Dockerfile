# syntax=docker/dockerfile:1

# ============================================================================
# Stage 1: builder — install deps and produce the static Vite build
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Baked into the JS bundle at build time — Vite env vars are NOT read at
# container runtime, so this must be set as a build arg per environment
# (e.g. --build-arg VITE_API_URL=https://api.yourdomain.com)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================================
# Stage 2: final — unprivileged nginx serving the static build
# ============================================================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS final

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx-unprivileged already runs as a non-root user and listens on 8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
