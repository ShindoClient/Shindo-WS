# ---- build stage ----
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
COPY tsconfig.json ./
COPY src ./src
RUN pnpm install --offline
RUN pnpm build

# ---- runtime ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch --prod && pnpm install --prod --offline
COPY --from=builder /app/dist ./dist
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
