# Multi-stage build for full-stack deployment
# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm ci

# Copy frontend source and build
COPY index.html vite.config.js eslint.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# Verify the build output
RUN ls -la dist/ && cat dist/index.html

# Stage 2: Setup backend and serve everything
FROM node:20-alpine AS production
WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist ./dist

# Log what we have
RUN echo "=== Checking dist folder ===" && ls -la ./dist/

# Setup server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy all server files
COPY server/ ./

# Verify structure
RUN echo "=== Server directory content ===" && ls -la && \
    echo "=== Checking ../dist from server ===" && ls -la ../dist/ || echo "dist not found!"

# Expose the server port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server.js"]
