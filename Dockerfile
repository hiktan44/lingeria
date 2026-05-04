FROM node:20-alpine

WORKDIR /app

# Backend dosyalarını kopyala
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN npm run build

EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000
CMD ["npm", "start"]
