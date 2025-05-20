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

RUN apk add --no-cache wget

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY server ./server
COPY --from=builder /app/dist ./dist

RUN pnpm install --frozen-lockfile && pnpm prune --prod

RUN chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
ENV PORT=3005
ENV SERVICE_ID=s_dashboard

ENV TARGET_API_HEADER=x-target-api-service
ENV STORE_URL_HEADER=x-base-url
ENV SERVER_URL_HEADER=x-server-url


HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://localhost:${PORT}/health || exit 1

EXPOSE 3005

CMD ["pnpm", "run", "server:prod"]
