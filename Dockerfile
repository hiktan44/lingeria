FROM node:20-alpine

WORKDIR /app

# Build sırasında NODE_ENV development olmalı ki devDependencies kurulsun
ENV NODE_ENV=development

# Tüm paketleri kur (devDependencies dahil)
COPY backend/package*.json ./
RUN npm ci --include=dev

# Backend kodunu kopyala
COPY backend/ .

# TypeScript build
RUN npm run build

# Production'a hazırla - dev paketleri sil
RUN npm prune --production

EXPOSE 4000

# Runtime için production
ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]
