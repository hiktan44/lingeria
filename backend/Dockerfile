FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN npm prune --production

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "start"]
