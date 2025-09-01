FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm ci
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build
ENV NODE_ENV=production
CMD ["node","dist/index.js"]
