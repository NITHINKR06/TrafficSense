# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS dependencies

ENV COREPACK_HOME=/opt/corepack \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
RUN corepack enable \
    && mkdir -p /opt/corepack /app/.next \
    && chown -R node:node /opt/corepack /app

USER node
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install && pnpm install --frozen-lockfile

FROM dependencies AS development
COPY --chown=node:node . .
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

FROM development AS builder
RUN pnpm build

FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

WORKDIR /app
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
