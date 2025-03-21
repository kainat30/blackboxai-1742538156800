# Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production Stage
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/public ./public

# Copy configuration files
COPY --from=builder /usr/src/app/config.js ./
COPY --from=builder /usr/src/app/database/schema.sql ./database/

# Create data directory for SQLite
RUN mkdir -p /usr/src/app/data && \
    chown -R node:node /usr/src/app/data

# Create logs directory
RUN mkdir -p /usr/src/app/logs && \
    chown -R node:node /usr/src/app/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]

# Labels
LABEL maintainer="Expense Tracker Team <team@example.com>"
LABEL version="1.0.0"
LABEL description="Expense Tracker Application"

# Build-time metadata
ARG BUILD_DATE
ARG VCS_REF
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/username/expense-tracker" \
      org.label-schema.schema-version="1.0"

# Security
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/src/app

# Set up volumes
VOLUME ["/usr/src/app/data", "/usr/src/app/logs"]

# Development Stage
FROM builder as development

# Install development dependencies
RUN npm install

# Set environment to development
ENV NODE_ENV=development

# Start development server
CMD ["npm", "run", "dev"]

# Test Stage
FROM builder as test

# Install all dependencies (including devDependencies)
RUN npm install

# Set environment to test
ENV NODE_ENV=test

# Run tests
CMD ["npm", "test"]