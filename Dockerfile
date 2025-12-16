# ------------------------------
# 1. Builder Stage
# ------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies and tools needed for building (including OpenSSL for Prisma)
RUN apk add --no-cache libc6-compat python3 make g++ openssl

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema BEFORE npm ci (needed for postinstall script)
COPY prisma ./prisma/

# Install dependencies based on lock file
RUN npm ci

# Copy the rest of the project (excluding files mentioned in .dockerignore)
COPY . .

# Environment variable to enable standalone mode for Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV STANDALONE_MODE=true

# Generate Prisma Client (explicitly, though postinstall might have done it)
RUN npx prisma generate

# Build the Next.js app
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

# Install ONLY production dependencies (cleaner/faster than copying everything)
# Note: In standalone mode, we might not strictly need this if node_modules are bundled,
# but it's safer for things like prisma client interaction scripts.
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