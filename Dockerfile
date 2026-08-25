# Assumption: Node 22 + tsx runs server/harness.ts; Rapier WASM needs glibc (bookworm, not alpine).
# Node 22+ has native WebSocket (supabase-js realtime); admin client also passes `ws` for Node < 22.
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
# Render/Fly inject PORT at runtime; local/Oracle Compose use 8787.
ENV HARNESS_PORT=8787
EXPOSE 8787

CMD ["npx", "tsx", "server/harness.ts"]
