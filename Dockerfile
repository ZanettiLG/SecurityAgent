FROM node:22-alpine

WORKDIR /app

# Runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    tini

# Install all dependencies (including dev for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Build TypeScript
COPY tsconfig.json .
COPY src/ ./src/
RUN npm run build

# Prune dev dependencies for smaller image
RUN npm prune --omit=dev

# Config and data dirs
COPY config/ ./config/
RUN mkdir -p /app/data /app/recordings

EXPOSE 5174

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/core/agent.js"]

# Create data directories
RUN mkdir -p /app/data /app/recordings

EXPOSE 8000

CMD ["python", "-m", "src.core.agent"]
