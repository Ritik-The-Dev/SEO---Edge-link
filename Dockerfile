# EdgeLink — SEO Intelligence
#
# Two runnable targets:
#   docker build --target web    -t edgelink-web .     # Next.js server (Vercel-equivalent)
#   docker build --target worker -t edgelink-worker .  # long-lived BullMQ worker + Chromium
#
# The worker target is the recommended way to run the queue consumer on any
# always-on host; it installs Chromium because Puppeteer renders the PDF reports.

# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies only when needed
COPY package.json package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN npm ci --only=production

FROM base AS production
RUN addgroup --gid 1001 --system nodejs
RUN adduser --uid 1001 --system --ingroup nodejs nextjs

COPY --from=base /app/node_modules ./node_modules
COPY . .

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]