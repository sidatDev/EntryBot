# ------------------------------
# 1. Builder Stage
# ------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies and tools needed for building
RUN apk add --no-cache libc6-compat python3 make g++ openssl

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm ci (needed for postinstall script)
COPY prisma ./prisma/

# Install dependencies based on lock file
RUN npm ci

# Copy the rest of the project (excluding files mentioned in .dockerignore)
COPY . .

# Build Next.js application
RUN npm run build



# ------------------------------
# 2. Runner / Production Stage
# ------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Copy the entire app build output from builder
COPY --from=builder /app ./

# Install ONLY production dependencies
RUN npm install --omit=dev --no-optional

# Create a startup script that starts the production server
RUN echo '#!/bin/sh' > start_server.sh && \
    echo 'echo "Starting Next.js production server..."' >> start_server.sh && \
    echo 'echo "Server will listen on $HOST:$PORT"' >> start_server.sh && \
    echo 'exec npm start' >> start_server.sh && \
    chmod +x start_server.sh

# Next.js serves static assets from here
ENV PORT=3000
EXPOSE 3000

# Set HOST to 0.0.0.0 to ensure the server listens on all interfaces
ENV HOST=0.0.0.0

# Start production server using the startup script
CMD ["./start_server.sh"]