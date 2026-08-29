# ---- Stage 1: build backend ----
FROM node:20-alpine AS backend-builder
WORKDIR /app
ENV NODE_ENV=development
COPY backend/package*.json ./
RUN npm ci --include=dev
COPY backend/ .
RUN npm run build

# ---- Stage 2: build frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app
ENV NODE_ENV=development
COPY frontend/package*.json ./
RUN npm ci --include=dev
COPY frontend/ .
ENV NEXT_PUBLIC_BACKEND_URL=""
ENV NEXT_PUBLIC_API_URL=""
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache bash

# Backend: production deps + built dist
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY --from=backend-builder /app/dist ./dist

# Frontend: standalone output
WORKDIR /app/frontend
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# Start script
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["./start.sh"]

# --- Agentic Security Firewall: Katman 2 (non-root hardening) ---
RUN [ -d /app ] && chown -R node:node /app || true
USER node
