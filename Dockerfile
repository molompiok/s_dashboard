# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Installe pnpm globalement
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache wget

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Installe pnpm globalement
RUN npm install -g pnpm


COPY . .


RUN pnpm install --frozen-lockfile && pnpm prune --prod

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
ENV PORT=3005



HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:${PORT}/health || exit 1

EXPOSE 3005

CMD ["pnpm", "run", "server:prod"]