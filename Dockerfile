# Assumption: Node 20 + tsx runs server/harness.ts; Rapier WASM needs glibc (bookworm, not alpine).
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
# Render/Fly inject PORT at runtime; local/Oracle Compose use 8787.
ENV HARNESS_PORT=8787
EXPOSE 8787

CMD ["npx", "tsx", "server/harness.ts"]
