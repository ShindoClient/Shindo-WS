# ---- build stage ----
FROM node:20-alpine AS builder

# Enable corepack (brings pnpm)
RUN corepack enable

WORKDIR /app

# Only lockfile + package.json for better cache
COPY package.json pnpm-lock.yaml ./

# Pre-fetch deps to pnpm store (better caching)
RUN pnpm fetch

# Copy the rest
COPY tsconfig.json ./
COPY src ./src

# Install (offline from store) and build
RUN pnpm install --offline
RUN pnpm build

# ---- production runtime ----
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=8080
# Map Render's PORT
EXPOSE 8080

# Enable corepack for pnpm runtime ops if needed
RUN corepack enable

WORKDIR /app

# Copy only prod deps (using the same lockfile)
# Fetch prod subset into store, then install offline
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch --prod && pnpm install --prod --offline

# App dist
COPY --from=builder /app/dist ./dist

# Optionally copy .env if you bake it at build time (Render usually injects envs)
# COPY .env ./.env

# Healthcheck (optional): hits the HTTP root, or create /v1/health in your app
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT||8080)).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
