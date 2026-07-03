# ── Build Stage ──
FROM node:22-alpine AS builder

WORKDIR /app

# Runtime build dependencies for native modules (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++

# Install ALL dependencies (including devDependencies for tsc)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune devDependencies after build
RUN npm prune --omit=dev

# ── Runtime Stage ──
FROM node:22-alpine

WORKDIR /app

# Runtime system dependencies
RUN apk add --no-cache \
    ffmpeg \
    tini

# Copy production node_modules and built dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copy config (mounted as read-only at runtime in compose, but included for standalone use)
COPY config/ ./config/
RUN mkdir -p /app/data /app/recordings

EXPOSE 5174

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/core/agent.js"]
