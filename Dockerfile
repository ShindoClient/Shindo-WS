# ---- build stage ----
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app

# Copia manifest/lock e instala (com rede aqui)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copia o resto e builda
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Mantém só dependências de produção
RUN pnpm prune --prod

# ---- runtime ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
WORKDIR /app

# Copia apenas o necessário pro runtime
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY --from=builder /app/dist ./dist

# (Opcional) healthcheck — troque a rota se tiver /v1/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
