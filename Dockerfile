# syntax=docker/dockerfile:1

# =============================================================================
# ANGEL AI — container image
# Stage 1 builds the Vite/React SPA (dist/) and the bundled Express API
# (server-build/server.cjs). Stage 2 runs the production web + API server.
# =============================================================================

# ----------------------------- Build stage -----------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Build-time tooling (vite, esbuild, typescript, tsx) needs devDependencies.
ENV NODE_ENV=development
COPY package.json bun.lock ./
RUN npm install --no-audit --no-fund

COPY . .

# Optional commit marker consumed by scripts/write-build-meta.mjs.
ARG COMMIT_REF=""
ENV COMMIT_REF=$COMMIT_REF

RUN npm run build

# ---------------------------- Runtime stage ----------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DISABLE_HMR=true

# Runtime dependencies only, plus tsx which executes the TypeScript server
# entrypoint (devServer.ts). tsx is not persisted into package.json.
COPY package.json bun.lock ./
RUN npm install --omit=dev --no-audit --no-fund \
 && npm install --no-save --no-audit --no-fund "tsx@^4.21.0" \
 && npm cache clean --force

# Built assets and server sources (server/buildMeta.ts carries the build marker).
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-build ./server-build
COPY --from=build /app/server ./server
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/devServer.ts ./devServer.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

# devServer.ts serves dist/ statically and binds 0.0.0.0:$PORT in production.
EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "--no-install", "tsx", "devServer.ts"]
