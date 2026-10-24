FROM oven/bun:1.4.4 AS bun

FROM node:22.22.2-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM node:22.22.2-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=10000
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 10000
CMD ["node", ".output/server/index.mjs"]