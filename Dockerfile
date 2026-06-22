FROM node:22-alpine

WORKDIR /app

# Runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    tini

# Dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build
COPY tsconfig.json .
COPY src/ ./src/
RUN npm run build

# Data dirs
RUN mkdir -p /app/data /app/recordings

EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/core/agent.js"]

# Application
COPY src/ ./src/
COPY config/ ./config/

# Create data directories
RUN mkdir -p /app/data /app/recordings

EXPOSE 8000

CMD ["python", "-m", "src.core.agent"]
