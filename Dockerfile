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
ENV PORT=3000
ENV HOST=0.0.0.0

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files from the builder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Server.js is created by next build from the standalone output
CMD ["node", "server.js"]