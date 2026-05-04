FROM node:20-alpine

WORKDIR /app

# Tüm paketleri kur (dev de dahil, build için TypeScript gerekli)
COPY backend/package*.json ./
RUN npm ci

# Backend kodunu kopyala
COPY backend/ .

# TypeScript build
RUN npm run build

# Production'a hazırla - dev paketleri sil
RUN npm prune --production

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]
