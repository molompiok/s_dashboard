# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Création utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist

RUN pnpm install --prod --frozen-lockfile && pnpm store prune

RUN chown -R appuser:appgroup /app
USER appuser

# Env variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Healthcheck (exige un endpoint /health dans l'app)
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://0.0.0.0:${PORT}/health || exit 1

EXPOSE 3000
CMD ["node", "dist/server/entry.mjs"]
