# EdgeLink — SEO Intelligence
#
# Two runnable targets:
#   docker build --target web    -t edgelink-web .     # Next.js server (Vercel-equivalent)
#   docker build --target worker -t edgelink-worker .  # long-lived BullMQ worker + Chromium
#
# The worker target is the recommended way to run the queue consumer on any
# always-on host; it installs Chromium because Puppeteer renders the PDF reports.

# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install exactly the locked dependency tree once and reuse it.
FROM base AS deps
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, so the schema must exist before install.
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

FROM deps AS build
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ---- Web: the Next.js server -------------------------------------------------
FROM base AS web
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY package.json next.config.mjs ./
EXPOSE 3000
CMD ["npm", "start"]

# ---- Worker: BullMQ consumer + Puppeteer/Chromium ----------------------------
FROM base AS worker
ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN mkdir -p /app/.data/reports
CMD ["npm", "run", "worker"]
