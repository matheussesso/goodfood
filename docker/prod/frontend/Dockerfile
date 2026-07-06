# syntax=docker/dockerfile:1

FROM node:24-slim AS deps
WORKDIR /app
COPY src/frontend/package.json src/frontend/package-lock.json ./
RUN npm ci

FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/frontend/. .

# NEXT_PUBLIC_* is embedded into the client bundle at build time, so it
# must be passed as a build arg (see docker-compose.yml / ci-cd.yml).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# .next/standalone already includes server.js plus only the node_modules
# required at runtime (requires output: "standalone" in next.config.ts).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
