2026-Jan-07 13:27:34.476399
Starting deployment of sidatDev/EntryBot:main to localhost.
2026-Jan-07 13:27:34.773061
Preparing container with helper image: ghcr.io/coollabsio/coolify-helper:1.0.12
2026-Jan-07 13:27:34.974358
[CMD]: docker stop -t 30 x8g0c4gkg8gs8o0ccwos8cgc
2026-Jan-07 13:27:34.974358
Error response from daemon: No such container: x8g0c4gkg8gs8o0ccwos8cgc
2026-Jan-07 13:27:35.230224
[CMD]: docker run -d --network coolify --name x8g0c4gkg8gs8o0ccwos8cgc  --rm -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/coollabsio/coolify-helper:1.0.12
2026-Jan-07 13:27:35.230224
fc0b45340ea803911d9e59882e960f6d2d0a243bf4fddc3c709e71cabafae76b
2026-Jan-07 13:27:37.592929
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'GIT_SSH_COMMAND="ssh -o ConnectTimeout=30 -p 22 -o Port=22 -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" git ls-remote https://x-access-token:<REDACTED>@github.com/sidatDev/EntryBot.git refs/heads/main'
2026-Jan-07 13:27:37.592929
d3536fe25bc664229c503ee53fa394d3aba4a479	refs/heads/main
2026-Jan-07 13:27:37.865668
----------------------------------------
2026-Jan-07 13:27:37.884584
Importing sidatDev/EntryBot:main (commit sha d3536fe25bc664229c503ee53fa394d3aba4a479) to /artifacts/x8g0c4gkg8gs8o0ccwos8cgc.
2026-Jan-07 13:27:38.139997
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'git clone --depth=1 --recurse-submodules --shallow-submodules -b 'main' 'https://x-access-token:<REDACTED>@github.com/sidatDev/EntryBot.git' '/artifacts/x8g0c4gkg8gs8o0ccwos8cgc' && cd '/artifacts/x8g0c4gkg8gs8o0ccwos8cgc' && if [ -f .gitmodules ]; then git submodule sync && GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" git submodule update --init --recursive --depth=1; fi && cd '/artifacts/x8g0c4gkg8gs8o0ccwos8cgc' && GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" git lfs pull'
2026-Jan-07 13:27:38.139997
Cloning into '/artifacts/x8g0c4gkg8gs8o0ccwos8cgc'...
2026-Jan-07 13:27:39.951463
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cd /artifacts/x8g0c4gkg8gs8o0ccwos8cgc && git log -1 d3536fe25bc664229c503ee53fa394d3aba4a479 --pretty=%B'
2026-Jan-07 13:27:39.951463
Merge pull request #1 from sidatDev/QWEN-VL
2026-Jan-07 13:27:39.951463
2026-Jan-07 13:27:39.951463
feat: Add identity card management including server actions for savin…
2026-Jan-07 13:27:40.203720
Image not found (k8ocgs4kosg88gs48g804g4w:d3536fe25bc664229c503ee53fa394d3aba4a479). Building new image.
2026-Jan-07 13:27:41.216195
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/Dockerfile'
2026-Jan-07 13:27:41.216195
# ------------------------------
2026-Jan-07 13:27:41.216195
# 1. Builder Stage
2026-Jan-07 13:27:41.216195
# ------------------------------
2026-Jan-07 13:27:41.216195
FROM node:24-alpine AS builder
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
WORKDIR /app
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Install dependencies and tools needed for building (including OpenSSL for Prisma)
2026-Jan-07 13:27:41.216195
RUN apk add --no-cache libc6-compat python3 make g++ openssl
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Copy package files
2026-Jan-07 13:27:41.216195
COPY package.json package-lock.json ./
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Copy Prisma schema BEFORE npm ci (needed for postinstall script)
2026-Jan-07 13:27:41.216195
COPY prisma ./prisma/
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Install dependencies based on lock file
2026-Jan-07 13:27:41.216195
RUN npm ci
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Copy the rest of the project (excluding files mentioned in .dockerignore)
2026-Jan-07 13:27:41.216195
COPY . .
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Environment variable to enable standalone mode for Next.js
2026-Jan-07 13:27:41.216195
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:41.216195
ENV STANDALONE_MODE=true
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Generate Prisma Client (explicitly, though postinstall might have done it)
2026-Jan-07 13:27:41.216195
RUN npx prisma generate
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Build the Next.js app
2026-Jan-07 13:27:41.216195
RUN npm run build
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# ------------------------------
2026-Jan-07 13:27:41.216195
# 2. Runner / Production Stage
2026-Jan-07 13:27:41.216195
# ------------------------------
2026-Jan-07 13:27:41.216195
FROM node:24-alpine AS runner
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
WORKDIR /app
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
ENV NODE_ENV=production
2026-Jan-07 13:27:41.216195
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Install OpenSSL for Prisma compatibility
2026-Jan-07 13:27:41.216195
RUN apk add --no-cache openssl
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Copy the entire app build output from builder
2026-Jan-07 13:27:41.216195
COPY --from=builder /app ./
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Install ONLY production dependencies (cleaner/faster than copying everything)
2026-Jan-07 13:27:41.216195
# Note: In standalone mode, we might not strictly need this if node_modules are bundled,
2026-Jan-07 13:27:41.216195
# but it's safer for things like prisma client interaction scripts.
2026-Jan-07 13:27:41.216195
RUN npm install --omit=dev --no-optional
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Create a startup script that starts the production server
2026-Jan-07 13:27:41.216195
RUN echo '#!/bin/sh' > start_server.sh && \
2026-Jan-07 13:27:41.216195
echo 'echo "Starting Next.js production server..."' >> start_server.sh && \
2026-Jan-07 13:27:41.216195
echo 'echo "Server will listen on $HOST:$PORT"' >> start_server.sh && \
2026-Jan-07 13:27:41.216195
echo 'exec npm start' >> start_server.sh && \
2026-Jan-07 13:27:41.216195
chmod +x start_server.sh
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Next.js serves static assets from here
2026-Jan-07 13:27:41.216195
ENV PORT=3000
2026-Jan-07 13:27:41.216195
EXPOSE 3000
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Set HOST to 0.0.0.0 to ensure the server listens on all interfaces
2026-Jan-07 13:27:41.216195
ENV HOST=0.0.0.0
2026-Jan-07 13:27:41.216195
2026-Jan-07 13:27:41.216195
# Start production server using the startup script
2026-Jan-07 13:27:41.216195
CMD ["./start_server.sh"]
2026-Jan-07 13:27:41.613610
Creating build-time .env file in /artifacts (outside Docker context).
2026-Jan-07 13:27:42.128630
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/build-time.env'
2026-Jan-07 13:27:42.128630
COOLIFY_URL='https://entrybot.sidattech.com'
2026-Jan-07 13:27:42.128630
COOLIFY_FQDN='entrybot.sidattech.com'
2026-Jan-07 13:27:42.128630
COOLIFY_BRANCH='main'
2026-Jan-07 13:27:42.128630
COOLIFY_RESOURCE_UUID='k8ocgs4kosg88gs48g804g4w'
2026-Jan-07 13:27:42.128630
AWS_ACCESS_KEY_ID="YsqlNDkuMt5varnP"
2026-Jan-07 13:27:42.128630
AWS_REGION="us-east-1"
2026-Jan-07 13:27:42.128630
AWS_S3_BUCKET_NAME="public-bucket"
2026-Jan-07 13:27:42.128630
AWS_S3_ENDPOINT="https://data-entrybot.sidattech.com"
2026-Jan-07 13:27:42.128630
AWS_SECRET_ACCESS_KEY="d8PLU9YuWyKxFoWYsLUuOasU2pOzdYVf"
2026-Jan-07 13:27:42.128630
DATABASE_URL="postgres://postgres:<REDACTED>@y0s4ckg8ok8cs0s0k0w4c08c:5432/postgres"
2026-Jan-07 13:27:42.128630
NEXTAUTH_SECRET="3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8="
2026-Jan-07 13:27:42.128630
NEXTAUTH_URL="https://entrybot.sidattech.com"
2026-Jan-07 13:27:42.128630
OCR_SERVICE_URL="https://paddle-ocr.sidattech.com/process-url"
2026-Jan-07 13:27:42.448013
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/Dockerfile'
2026-Jan-07 13:27:42.448013
# ------------------------------
2026-Jan-07 13:27:42.448013
# 1. Builder Stage
2026-Jan-07 13:27:42.448013
# ------------------------------
2026-Jan-07 13:27:42.448013
FROM node:24-alpine AS builder
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
WORKDIR /app
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Install dependencies and tools needed for building (including OpenSSL for Prisma)
2026-Jan-07 13:27:42.448013
RUN apk add --no-cache libc6-compat python3 make g++ openssl
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Copy package files
2026-Jan-07 13:27:42.448013
COPY package.json package-lock.json ./
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Copy Prisma schema BEFORE npm ci (needed for postinstall script)
2026-Jan-07 13:27:42.448013
COPY prisma ./prisma/
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Install dependencies based on lock file
2026-Jan-07 13:27:42.448013
RUN npm ci
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Copy the rest of the project (excluding files mentioned in .dockerignore)
2026-Jan-07 13:27:42.448013
COPY . .
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Environment variable to enable standalone mode for Next.js
2026-Jan-07 13:27:42.448013
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:42.448013
ENV STANDALONE_MODE=true
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Generate Prisma Client (explicitly, though postinstall might have done it)
2026-Jan-07 13:27:42.448013
RUN npx prisma generate
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Build the Next.js app
2026-Jan-07 13:27:42.448013
RUN npm run build
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# ------------------------------
2026-Jan-07 13:27:42.448013
# 2. Runner / Production Stage
2026-Jan-07 13:27:42.448013
# ------------------------------
2026-Jan-07 13:27:42.448013
FROM node:24-alpine AS runner
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
WORKDIR /app
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
ENV NODE_ENV=production
2026-Jan-07 13:27:42.448013
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Install OpenSSL for Prisma compatibility
2026-Jan-07 13:27:42.448013
RUN apk add --no-cache openssl
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Copy the entire app build output from builder
2026-Jan-07 13:27:42.448013
COPY --from=builder /app ./
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Install ONLY production dependencies (cleaner/faster than copying everything)
2026-Jan-07 13:27:42.448013
# Note: In standalone mode, we might not strictly need this if node_modules are bundled,
2026-Jan-07 13:27:42.448013
# but it's safer for things like prisma client interaction scripts.
2026-Jan-07 13:27:42.448013
RUN npm install --omit=dev --no-optional
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Create a startup script that starts the production server
2026-Jan-07 13:27:42.448013
RUN echo '#!/bin/sh' > start_server.sh && \
2026-Jan-07 13:27:42.448013
echo 'echo "Starting Next.js production server..."' >> start_server.sh && \
2026-Jan-07 13:27:42.448013
echo 'echo "Server will listen on $HOST:$PORT"' >> start_server.sh && \
2026-Jan-07 13:27:42.448013
echo 'exec npm start' >> start_server.sh && \
2026-Jan-07 13:27:42.448013
chmod +x start_server.sh
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Next.js serves static assets from here
2026-Jan-07 13:27:42.448013
ENV PORT=3000
2026-Jan-07 13:27:42.448013
EXPOSE 3000
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Set HOST to 0.0.0.0 to ensure the server listens on all interfaces
2026-Jan-07 13:27:42.448013
ENV HOST=0.0.0.0
2026-Jan-07 13:27:42.448013
2026-Jan-07 13:27:42.448013
# Start production server using the startup script
2026-Jan-07 13:27:42.448013
CMD ["./start_server.sh"]
2026-Jan-07 13:27:42.511438
Final Dockerfile:
2026-Jan-07 13:27:43.080459
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/Dockerfile'
2026-Jan-07 13:27:43.080459
# ------------------------------
2026-Jan-07 13:27:43.080459
# 1. Builder Stage
2026-Jan-07 13:27:43.080459
# ------------------------------
2026-Jan-07 13:27:43.080459
FROM node:24-alpine AS builder
2026-Jan-07 13:27:43.080459
ARG AWS_ACCESS_KEY_ID=YsqlNDkuMt5varnP
2026-Jan-07 13:27:43.080459
ARG AWS_REGION=us-east-1
2026-Jan-07 13:27:43.080459
ARG AWS_S3_BUCKET_NAME=public-bucket
2026-Jan-07 13:27:43.080459
ARG AWS_S3_ENDPOINT=https://data-entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG AWS_SECRET_ACCESS_KEY=d8PLU9YuWyKxFoWYsLUuOasU2pOzdYVf
2026-Jan-07 13:27:43.080459
ARG DATABASE_URL=postgres://postgres:<REDACTED>@y0s4ckg8ok8cs0s0k0w4c08c:5432/postgres
2026-Jan-07 13:27:43.080459
ARG NEXTAUTH_SECRET=3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8=
2026-Jan-07 13:27:43.080459
ARG NEXTAUTH_URL=https://entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG OCR_SERVICE_URL=https://paddle-ocr.sidattech.com/process-url
2026-Jan-07 13:27:43.080459
ARG COOLIFY_URL=https://entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG COOLIFY_FQDN=entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG COOLIFY_BRANCH=main
2026-Jan-07 13:27:43.080459
ARG COOLIFY_RESOURCE_UUID=k8ocgs4kosg88gs48g804g4w
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
WORKDIR /app
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Install dependencies and tools needed for building (including OpenSSL for Prisma)
2026-Jan-07 13:27:43.080459
RUN apk add --no-cache libc6-compat python3 make g++ openssl
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Copy package files
2026-Jan-07 13:27:43.080459
COPY package.json package-lock.json ./
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Copy Prisma schema BEFORE npm ci (needed for postinstall script)
2026-Jan-07 13:27:43.080459
COPY prisma ./prisma/
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Install dependencies based on lock file
2026-Jan-07 13:27:43.080459
RUN npm ci
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Copy the rest of the project (excluding files mentioned in .dockerignore)
2026-Jan-07 13:27:43.080459
COPY . .
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Environment variable to enable standalone mode for Next.js
2026-Jan-07 13:27:43.080459
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:43.080459
ENV STANDALONE_MODE=true
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Generate Prisma Client (explicitly, though postinstall might have done it)
2026-Jan-07 13:27:43.080459
RUN npx prisma generate
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Build the Next.js app
2026-Jan-07 13:27:43.080459
RUN npm run build
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# ------------------------------
2026-Jan-07 13:27:43.080459
# 2. Runner / Production Stage
2026-Jan-07 13:27:43.080459
# ------------------------------
2026-Jan-07 13:27:43.080459
FROM node:24-alpine AS runner
2026-Jan-07 13:27:43.080459
ARG AWS_ACCESS_KEY_ID=YsqlNDkuMt5varnP
2026-Jan-07 13:27:43.080459
ARG AWS_REGION=us-east-1
2026-Jan-07 13:27:43.080459
ARG AWS_S3_BUCKET_NAME=public-bucket
2026-Jan-07 13:27:43.080459
ARG AWS_S3_ENDPOINT=https://data-entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG AWS_SECRET_ACCESS_KEY=d8PLU9YuWyKxFoWYsLUuOasU2pOzdYVf
2026-Jan-07 13:27:43.080459
ARG DATABASE_URL=postgres://postgres:<REDACTED>@y0s4ckg8ok8cs0s0k0w4c08c:5432/postgres
2026-Jan-07 13:27:43.080459
ARG NEXTAUTH_SECRET=3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8=
2026-Jan-07 13:27:43.080459
ARG NEXTAUTH_URL=https://entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG OCR_SERVICE_URL=https://paddle-ocr.sidattech.com/process-url
2026-Jan-07 13:27:43.080459
ARG COOLIFY_URL=https://entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG COOLIFY_FQDN=entrybot.sidattech.com
2026-Jan-07 13:27:43.080459
ARG COOLIFY_BRANCH=main
2026-Jan-07 13:27:43.080459
ARG COOLIFY_RESOURCE_UUID=k8ocgs4kosg88gs48g804g4w
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
WORKDIR /app
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
ENV NODE_ENV=production
2026-Jan-07 13:27:43.080459
ENV NEXT_TELEMETRY_DISABLED=1
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Install OpenSSL for Prisma compatibility
2026-Jan-07 13:27:43.080459
RUN apk add --no-cache openssl
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Copy the entire app build output from builder
2026-Jan-07 13:27:43.080459
COPY --from=builder /app ./
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Install ONLY production dependencies (cleaner/faster than copying everything)
2026-Jan-07 13:27:43.080459
# Note: In standalone mode, we might not strictly need this if node_modules are bundled,
2026-Jan-07 13:27:43.080459
# but it's safer for things like prisma client interaction scripts.
2026-Jan-07 13:27:43.080459
RUN npm install --omit=dev --no-optional
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Create a startup script that starts the production server
2026-Jan-07 13:27:43.080459
RUN echo '#!/bin/sh' > start_server.sh && \
2026-Jan-07 13:27:43.080459
echo 'echo "Starting Next.js production server..."' >> start_server.sh && \
2026-Jan-07 13:27:43.080459
echo 'echo "Server will listen on $HOST:$PORT"' >> start_server.sh && \
2026-Jan-07 13:27:43.080459
echo 'exec npm start' >> start_server.sh && \
2026-Jan-07 13:27:43.080459
chmod +x start_server.sh
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Next.js serves static assets from here
2026-Jan-07 13:27:43.080459
ENV PORT=3000
2026-Jan-07 13:27:43.080459
EXPOSE 3000
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Set HOST to 0.0.0.0 to ensure the server listens on all interfaces
2026-Jan-07 13:27:43.080459
ENV HOST=0.0.0.0
2026-Jan-07 13:27:43.080459
2026-Jan-07 13:27:43.080459
# Start production server using the startup script
2026-Jan-07 13:27:43.080459
CMD ["./start_server.sh"]
2026-Jan-07 13:27:43.096381
----------------------------------------
2026-Jan-07 13:27:43.115629
Building docker image started.
2026-Jan-07 13:27:43.133882
To check the current progress, click on Show Debug Logs.
2026-Jan-07 13:27:43.733529
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/build.sh'
2026-Jan-07 13:27:43.733529
cd /artifacts/x8g0c4gkg8gs8o0ccwos8cgc && set -a && source /artifacts/build-time.env && set +a && docker build  --add-host coolify:10.0.1.5 --add-host coolify-db:10.0.1.4 --add-host coolify-realtime:10.0.1.3 --add-host coolify-redis:10.0.1.2 --add-host gkog0kcsgk80w80csggsc8oc:10.0.1.11 --add-host gkog0kcsgk80w80csggsc8oc-proxy:10.0.1.12 --add-host jwo4ocs40gkgcws8c4oc48gk:10.0.1.13 --add-host ogkg04sso4s4ogwk8kw404s0:10.0.1.7 --add-host qw4okkckwkwoswg8o4w8s88s:10.0.1.18 --add-host qw4okkckwkwoswg8o4w8s88s-proxy:10.0.1.19 --add-host y0s4ckg8ok8cs0s0k0w4c08c:10.0.1.8 --add-host y0s4ckg8ok8cs0s0k0w4c08c-proxy:10.0.1.14 --network host -f /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/Dockerfile --build-arg COOLIFY_URL --build-arg COOLIFY_FQDN --build-arg COOLIFY_BRANCH --build-arg COOLIFY_RESOURCE_UUID --build-arg AWS_ACCESS_KEY_ID --build-arg AWS_REGION --build-arg AWS_S3_BUCKET_NAME --build-arg AWS_S3_ENDPOINT --build-arg AWS_SECRET_ACCESS_KEY --build-arg DATABASE_URL --build-arg NEXTAUTH_SECRET --build-arg NEXTAUTH_URL --build-arg OCR_SERVICE_URL --build-arg COOLIFY_BUILD_SECRETS_HASH=a67b22253eac299d00300609fb637069f87dff6729a19ebed2f8dda290852d05 --build-arg 'COOLIFY_URL' --build-arg 'COOLIFY_FQDN' --build-arg 'COOLIFY_BRANCH' --build-arg 'COOLIFY_RESOURCE_UUID' --progress plain -t k8ocgs4kosg88gs48g804g4w:d3536fe25bc664229c503ee53fa394d3aba4a479 /artifacts/x8g0c4gkg8gs8o0ccwos8cgc
2026-Jan-07 13:27:44.526141
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'bash /artifacts/build.sh'
2026-Jan-07 13:27:44.526141
#0 building with "default" instance using docker driver
2026-Jan-07 13:27:44.526141
2026-Jan-07 13:27:44.526141
#1 [internal] load build definition from Dockerfile
2026-Jan-07 13:27:44.526141
#1 transferring dockerfile: 3.46kB done
2026-Jan-07 13:27:44.526141
#1 DONE 0.1s
2026-Jan-07 13:27:44.700871
#2 [internal] load metadata for docker.io/library/node:24-alpine
2026-Jan-07 13:27:45.932636
#2 DONE 1.4s
2026-Jan-07 13:27:46.055513
#3 [internal] load .dockerignore
2026-Jan-07 13:27:46.055513
#3 transferring context: 370B done
2026-Jan-07 13:27:46.055513
#3 DONE 0.1s
2026-Jan-07 13:27:46.055513
2026-Jan-07 13:27:46.055513
#4 [builder 1/9] FROM docker.io/library/node:24-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8
2026-Jan-07 13:27:46.055513
#4 resolve docker.io/library/node:24-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 0.0s done
2026-Jan-07 13:27:46.055513
#4 DONE 0.0s
2026-Jan-07 13:27:46.055513
2026-Jan-07 13:27:46.055513
#5 [internal] load build context
2026-Jan-07 13:27:46.285778
#5 transferring context: 4.25MB 0.1s done
2026-Jan-07 13:27:46.285778
#5 DONE 0.2s
2026-Jan-07 13:27:46.285778
2026-Jan-07 13:27:46.285778
#4 [builder 1/9] FROM docker.io/library/node:24-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8
2026-Jan-07 13:27:46.285778
#4 sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 3.87kB / 3.87kB done
2026-Jan-07 13:27:46.285778
#4 sha256:c720a25dd3a78e6274d55267e76d89e5c096c46940b5ea83f7a99978feb0b514 1.72kB / 1.72kB done
2026-Jan-07 13:27:46.285778
#4 sha256:63277db82ca185691372a65fa6a721cf0ab49fad63d54204ed92283c7de30e75 6.52kB / 6.52kB done
2026-Jan-07 13:27:46.285778
#4 DONE 0.3s
2026-Jan-07 13:27:46.532663
#6 [builder 2/9] WORKDIR /app
2026-Jan-07 13:27:46.532663
#6 DONE 0.1s
2026-Jan-07 13:27:46.532663
2026-Jan-07 13:27:46.532663
#7 [builder 3/9] RUN apk add --no-cache libc6-compat python3 make g++ openssl
2026-Jan-07 13:27:47.378018
#7 0.995 ( 1/33) Installing libstdc++-dev (15.2.0-r2)
2026-Jan-07 13:27:47.620146
#7 ...
2026-Jan-07 13:27:47.620146
2026-Jan-07 13:27:47.620146
#8 [runner 3/6] RUN apk add --no-cache openssl
2026-Jan-07 13:27:47.620146
#8 1.024 (1/1) Installing openssl (3.5.4-r0)
2026-Jan-07 13:27:47.620146
#8 1.051 Executing busybox-1.37.0-r30.trigger
2026-Jan-07 13:27:47.620146
#8 1.085 OK: 11.7 MiB in 19 packages
2026-Jan-07 13:27:47.620146
#8 DONE 1.2s
2026-Jan-07 13:27:47.769107
#7 [builder 3/9] RUN apk add --no-cache libc6-compat python3 make g++ openssl
2026-Jan-07 13:27:47.781611
#7 1.399 ( 2/33) Installing jansson (2.14.1-r0)
2026-Jan-07 13:27:47.976881
#7 1.417 ( 3/33) Installing zstd-libs (1.5.7-r2)
2026-Jan-07 13:27:47.976881
#7 1.443 ( 4/33) Installing binutils (2.45.1-r0)
2026-Jan-07 13:27:47.983903
#7 1.596 ( 5/33) Installing libgomp (15.2.0-r2)
2026-Jan-07 13:27:48.080480
#7 1.618 ( 6/33) Installing libatomic (15.2.0-r2)
2026-Jan-07 13:27:48.080480
#7 1.635 ( 7/33) Installing gmp (6.3.0-r4)
2026-Jan-07 13:27:48.080480
#7 1.658 ( 8/33) Installing isl26 (0.26-r1)
2026-Jan-07 13:27:48.080480
#7 1.698 ( 9/33) Installing mpfr4 (4.2.2-r0)
2026-Jan-07 13:27:48.276066
#7 1.725 (10/33) Installing mpc1 (1.3.1-r1)
2026-Jan-07 13:27:48.276066
#7 1.742 (11/33) Installing gcc (15.2.0-r2)
2026-Jan-07 13:27:49.886340
#7 3.504 (12/33) Installing musl-dev (1.2.5-r21)
2026-Jan-07 13:27:50.032487
#7 3.649 (13/33) Installing g++ (15.2.0-r2)
2026-Jan-07 13:27:50.486284
#7 4.103 (14/33) Installing musl-obstack (1.2.3-r2)
2026-Jan-07 13:27:50.599989
#7 4.120 (15/33) Installing libucontext (1.3.3-r0)
2026-Jan-07 13:27:50.599989
#7 4.135 (16/33) Installing gcompat (1.1.0-r4)
2026-Jan-07 13:27:50.599989
#7 4.155 (17/33) Installing make (4.4.1-r3)
2026-Jan-07 13:27:50.599989
#7 4.174 (18/33) Installing openssl (3.5.4-r0)
2026-Jan-07 13:27:50.599989
#7 4.200 (19/33) Installing libbz2 (1.0.8-r6)
2026-Jan-07 13:27:50.599989
#7 4.217 (20/33) Installing libexpat (2.7.3-r0)
2026-Jan-07 13:27:50.718055
#7 4.235 (21/33) Installing libffi (3.5.2-r0)
2026-Jan-07 13:27:50.718055
#7 4.252 (22/33) Installing gdbm (1.26-r0)
2026-Jan-07 13:27:50.718055
#7 4.268 (23/33) Installing xz-libs (5.8.1-r0)
2026-Jan-07 13:27:50.718055
#7 4.289 (24/33) Installing mpdecimal (4.0.1-r0)
2026-Jan-07 13:27:50.718055
#7 4.307 (25/33) Installing ncurses-terminfo-base (6.5_p20251123-r0)
2026-Jan-07 13:27:50.718055
#7 4.336 (26/33) Installing libncursesw (6.5_p20251123-r0)
2026-Jan-07 13:27:50.959562
#7 4.356 (27/33) Installing libpanelw (6.5_p20251123-r0)
2026-Jan-07 13:27:50.959562
#7 4.372 (28/33) Installing readline (8.3.1-r0)
2026-Jan-07 13:27:50.959562
#7 4.393 (29/33) Installing sqlite-libs (3.51.1-r0)
2026-Jan-07 13:27:50.959562
#7 4.426 (30/33) Installing python3 (3.12.12-r0)
2026-Jan-07 13:27:51.201202
#7 4.818 (31/33) Installing python3-pycache-pyc0 (3.12.12-r0)
2026-Jan-07 13:27:51.461860
#7 5.079 (32/33) Installing pyc (3.12.12-r0)
2026-Jan-07 13:27:51.461860
#7 5.079 (33/33) Installing python3-pyc (3.12.12-r0)
2026-Jan-07 13:27:51.643564
#7 5.080 Executing busybox-1.37.0-r30.trigger
2026-Jan-07 13:27:51.643564
#7 5.111 OK: 302.1 MiB in 51 packages
2026-Jan-07 13:27:51.871788
#7 DONE 5.5s
2026-Jan-07 13:27:51.997211
#9 [builder 4/9] COPY package.json package-lock.json ./
2026-Jan-07 13:27:51.997211
#9 DONE 0.1s
2026-Jan-07 13:27:52.233953
#10 [builder 5/9] COPY prisma ./prisma/
2026-Jan-07 13:27:52.233953
#10 DONE 0.1s
2026-Jan-07 13:27:52.233953
2026-Jan-07 13:27:52.233953
#11 [builder 6/9] RUN npm ci
2026-Jan-07 13:28:08.919527
#11 16.84 npm warn deprecated w3c-hr-time@1.0.2: Use your platform's native performance.now() and performance.timeOrigin.
2026-Jan-07 13:28:12.238063
#11 20.16 npm warn deprecated domexception@2.0.1: Use your platform's native DOMException instead
2026-Jan-07 13:28:12.967684
#11 20.88 npm warn deprecated abab@2.0.6: Use your platform's native atob() and btoa() methods instead
2026-Jan-07 13:35:01.470230
#11 429.4
2026-Jan-07 13:35:01.470230
#11 429.4 > entry-bot@0.1.0 postinstall
2026-Jan-07 13:35:01.470230
#11 429.4 > prisma generate
2026-Jan-07 13:35:01.470230
#11 429.4
2026-Jan-07 13:35:02.846006
#11 430.8 Prisma schema loaded from prisma/schema.prisma
2026-Jan-07 13:35:04.341462
#11 432.3
2026-Jan-07 13:35:04.341462
#11 432.3 ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 639ms
2026-Jan-07 13:35:04.341462
#11 432.3
2026-Jan-07 13:35:04.341462
#11 432.3 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2026-Jan-07 13:35:04.341462
#11 432.3
2026-Jan-07 13:35:04.341462
#11 432.3 Help us improve the Prisma ORM for everyone. Share your feedback in a short 2-min survey: https://pris.ly/orm/survey/release-5-22
2026-Jan-07 13:35:04.341462
#11 432.3
2026-Jan-07 13:35:04.747845
#11 432.7
2026-Jan-07 13:35:04.747845
#11 432.7 added 2121 packages, and audited 2122 packages in 7m
2026-Jan-07 13:35:04.898991
#11 432.7
2026-Jan-07 13:35:04.898991
#11 432.7 289 packages are looking for funding
2026-Jan-07 13:35:04.898991
#11 432.7   run `npm fund` for details
2026-Jan-07 13:35:06.338648
#11 434.3
2026-Jan-07 13:35:06.338648
#11 434.3 51 moderate severity vulnerabilities
2026-Jan-07 13:35:06.338648
#11 434.3
2026-Jan-07 13:35:06.338648
#11 434.3 To address issues that do not require attention, run:
2026-Jan-07 13:35:06.338648
#11 434.3   npm audit fix
2026-Jan-07 13:35:06.338648
#11 434.3
2026-Jan-07 13:35:06.338648
#11 434.3 To address all issues (including breaking changes), run:
2026-Jan-07 13:35:06.338648
#11 434.3   npm audit fix --force
2026-Jan-07 13:35:06.338648
#11 434.3
2026-Jan-07 13:35:06.338648
#11 434.3 Run `npm audit` for details.
2026-Jan-07 13:35:06.510746
#11 434.3 npm notice
2026-Jan-07 13:35:06.510746
#11 434.3 npm notice New minor version of npm available! 11.6.2 -> 11.7.0
2026-Jan-07 13:35:06.510746
#11 434.3 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
2026-Jan-07 13:35:06.510746
#11 434.3 npm notice To update run: npm install -g npm@11.7.0
2026-Jan-07 13:35:06.510746
#11 434.3 npm notice
2026-Jan-07 13:35:11.246757
#11 DONE 439.2s
2026-Jan-07 13:35:11.410404
#12 [builder 7/9] COPY . .
2026-Jan-07 13:35:11.420658
#12 DONE 0.2s
2026-Jan-07 13:35:11.581290
#13 [builder 8/9] RUN npx prisma generate
2026-Jan-07 13:35:13.421542
#13 1.992 Prisma schema loaded from prisma/schema.prisma
2026-Jan-07 13:35:15.090003
#13 3.660
2026-Jan-07 13:35:15.090003
#13 3.660 ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 529ms
2026-Jan-07 13:35:15.090003
#13 3.660
2026-Jan-07 13:35:15.090003
#13 3.660 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2026-Jan-07 13:35:15.090003
#13 3.660
2026-Jan-07 13:35:15.090003
#13 3.660 Tip: Want to react to database changes in your app as they happen? Discover how with Pulse: https://pris.ly/tip-1-pulse
2026-Jan-07 13:35:15.090003
#13 3.660
2026-Jan-07 13:35:15.190894
#13 3.762 ┌─────────────────────────────────────────────────────────┐
2026-Jan-07 13:35:15.190894
#13 3.762 │  Update available 5.22.0 -> 7.2.0                       │
2026-Jan-07 13:35:15.190894
#13 3.762 │                                                         │
2026-Jan-07 13:35:15.190894
#13 3.762 │  This is a major update - please follow the guide at    │
2026-Jan-07 13:35:15.190894
#13 3.762 │  https://pris.ly/d/major-version-upgrade                │
2026-Jan-07 13:35:15.190894
#13 3.762 │                                                         │
2026-Jan-07 13:35:15.190894
#13 3.762 │  Run the following to update                            │
2026-Jan-07 13:35:15.190894
#13 3.762 │    npm i --save-dev prisma@latest                       │
2026-Jan-07 13:35:15.190894
#13 3.762 │    npm i @prisma/client@latest                          │
2026-Jan-07 13:35:15.190894
#13 3.762 └─────────────────────────────────────────────────────────┘
2026-Jan-07 13:35:15.400660
#13 DONE 4.0s
2026-Jan-07 13:35:15.561076
#14 [builder 9/9] RUN npm run build
2026-Jan-07 13:35:15.828416
#14 0.419
2026-Jan-07 13:35:15.828416
#14 0.419 > entry-bot@0.1.0 build
2026-Jan-07 13:35:15.828416
#14 0.419 > next build
2026-Jan-07 13:35:15.828416
#14 0.419
2026-Jan-07 13:35:17.858263
#14 2.450    ▲ Next.js 16.0.10 (Turbopack)
2026-Jan-07 13:35:18.097202
#14 2.451    - Experiments (use with caution):
2026-Jan-07 13:35:18.097202
#14 2.451      · serverActions
2026-Jan-07 13:35:18.097202
#14 2.451
2026-Jan-07 13:35:18.097202
#14 2.539    Creating an optimized production build ...
2026-Jan-07 13:36:39.636601
#14 84.22  ✓ Compiled successfully in 80s
2026-Jan-07 13:36:39.800651
#14 84.24    Running TypeScript ...
2026-Jan-07 13:36:58.965247
#14 103.6    Collecting page data using 7 workers ...
2026-Jan-07 13:37:00.794825
#14 105.4    Generating static pages using 7 workers (0/26) ...
2026-Jan-07 13:37:02.528380
#14 107.1    Generating static pages using 7 workers (6/26)
2026-Jan-07 13:37:02.650640
#14 107.2    Generating static pages using 7 workers (12/26)
2026-Jan-07 13:37:02.818891
#14 107.4 prisma:query SELECT "public"."Role"."id", "public"."Role"."name", "public"."Role"."description", "public"."Role"."permissions", "public"."Role"."isSystem", "public"."Role"."createdAt", "public"."Role"."updatedAt" FROM "public"."Role" WHERE 1=1 ORDER BY "public"."Role"."name" ASC OFFSET $1
2026-Jan-07 13:37:03.030557
#14 107.4 prisma:query SELECT "public"."Document"."id", "public"."Document"."name", "public"."Document"."url", "public"."Document"."type", "public"."Document"."size", "public"."Document"."status", "public"."Document"."approvalStatus", "public"."Document"."extractedText", "public"."Document"."category", "public"."Document"."source", "public"."Document"."uploaderId", "public"."Document"."organizationId", "public"."Document"."assignedToId", "public"."Document"."createdAt", "public"."Document"."updatedAt", "public"."Document"."deletedAt" FROM "public"."Document" WHERE ("public"."Document"."category" = $1 AND "public"."Document"."status" <> $2) ORDER BY "public"."Document"."createdAt" DESC OFFSET $3
2026-Jan-07 13:37:03.030557
#14 107.4 prisma:query SELECT "public"."_DocumentToTag"."A", "public"."_DocumentToTag"."B" FROM "public"."_DocumentToTag" WHERE "public"."_DocumentToTag"."A" IN ($1)
2026-Jan-07 13:37:03.030557
#14 107.5    Generating static pages using 7 workers (19/26)
2026-Jan-07 13:37:03.030557
#14 107.5 prisma:query SELECT "public"."Document"."id", "public"."Document"."name", "public"."Document"."url", "public"."Document"."type", "public"."Document"."size", "public"."Document"."status", "public"."Document"."approvalStatus", "public"."Document"."extractedText", "public"."Document"."category", "public"."Document"."source", "public"."Document"."uploaderId", "public"."Document"."organizationId", "public"."Document"."assignedToId", "public"."Document"."createdAt", "public"."Document"."updatedAt", "public"."Document"."deletedAt" FROM "public"."Document" WHERE "public"."Document"."status" = $1 ORDER BY "public"."Document"."updatedAt" ASC OFFSET $2
2026-Jan-07 13:37:03.030557
#14 107.5 prisma:query SELECT "public"."Document"."id", "public"."Document"."name", "public"."Document"."url", "public"."Document"."type", "public"."Document"."size", "public"."Document"."status", "public"."Document"."approvalStatus", "public"."Document"."extractedText", "public"."Document"."category", "public"."Document"."source", "public"."Document"."uploaderId", "public"."Document"."organizationId", "public"."Document"."assignedToId", "public"."Document"."createdAt", "public"."Document"."updatedAt", "public"."Document"."deletedAt" FROM "public"."Document" WHERE "public"."Document"."status" = $1 ORDER BY "public"."Document"."updatedAt" DESC OFFSET $2
2026-Jan-07 13:37:03.030557
#14 107.5 prisma:query SELECT "public"."Invoice"."id", "public"."Invoice"."type", "public"."Invoice"."status", "public"."Invoice"."invoiceNumber", "public"."Invoice"."date", "public"."Invoice"."dueDate", "public"."Invoice"."supplierName", "public"."Invoice"."customerName", "public"."Invoice"."subTotal", "public"."Invoice"."taxTotal", "public"."Invoice"."totalAmount", "public"."Invoice"."currency", "public"."Invoice"."paymentMethod", "public"."Invoice"."invoiceCurrency", "public"."Invoice"."exchangeRate", "public"."Invoice"."baseSubTotal", "public"."Invoice"."baseTaxTotal", "public"."Invoice"."baseVatRate", "public"."Invoice"."baseCurrencyAmount", "public"."Invoice"."vatRate", "public"."Invoice"."notes", "public"."Invoice"."documentId", "public"."Invoice"."createdAt", "public"."Invoice"."updatedAt" FROM "public"."Invoice" WHERE "public"."Invoice"."documentId" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) ORDER BY "public"."Invoice"."createdAt" DESC OFFSET $23
2026-Jan-07 13:37:03.062512
#14 107.7 prisma:query SELECT "public"."Organization"."id", "public"."Organization"."name", "public"."Organization"."type", "public"."Organization"."status", "public"."Organization"."credits", "public"."Organization"."parentId", "public"."Organization"."createdAt", "public"."Organization"."updatedAt", COALESCE("aggr_selection_0_Organization"."_aggr_count_children", 0) AS "_aggr_count_children", COALESCE("aggr_selection_1_User"."_aggr_count_users", 0) AS "_aggr_count_users" FROM "public"."Organization" LEFT JOIN (SELECT "public"."Organization"."parentId", COUNT(*) AS "_aggr_count_children" FROM "public"."Organization" WHERE 1=1 GROUP BY "public"."Organization"."parentId") AS "aggr_selection_0_Organization" ON ("public"."Organization"."id" = "aggr_selection_0_Organization"."parentId") LEFT JOIN (SELECT "public"."User"."organizationId", COUNT(*) AS "_aggr_count_users" FROM "public"."User" WHERE 1=1 GROUP BY "public"."User"."organizationId") AS "aggr_selection_1_User" ON ("public"."Organization"."id" = "aggr_selection_1_User"."organizationId") WHERE "public"."Organization"."type" = $1 ORDER BY "public"."Organization"."createdAt" DESC OFFSET $2
2026-Jan-07 13:37:03.182166
#14 107.7 prisma:query SELECT "public"."Package"."id", "public"."Package"."name", "public"."Package"."description", "public"."Package"."price", "public"."Package"."monthlyCredits", "public"."Package"."createdAt", "public"."Package"."updatedAt" FROM "public"."Package" WHERE 1=1 ORDER BY "public"."Package"."price" ASC OFFSET $1
2026-Jan-07 13:37:03.182166
#14 107.8  ✓ Generating static pages using 7 workers (26/26) in 2.4s
2026-Jan-07 13:37:03.289511
#14 107.9    Finalizing page optimization ...
2026-Jan-07 13:37:03.501544
#14 107.9
2026-Jan-07 13:37:03.501544
#14 107.9 Route (app)
2026-Jan-07 13:37:03.501544
#14 107.9 ┌ ƒ /
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /_not-found
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /api/auth/[...nextauth]
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /api/process-ai
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /api/process-url
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /bank-statements
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /dashboard
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /documents
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /documents/[id]/process
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /history
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /hub
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /hub/[orgId]
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /id-cards
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /integration-data
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /login
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /other-documents
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /qa
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /qa/[id]/review
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /recycle-bin
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /reports
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /roles
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /settings
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/organizations
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/organizations/[id]
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/organizations/[id]/new-child
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/organizations/new
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/packages
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/packages/[id]/edit
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /super-admin/packages/new
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /upload/[linkId]
2026-Jan-07 13:37:03.501544
#14 107.9 ├ ƒ /users
2026-Jan-07 13:37:03.501544
#14 107.9 └ ƒ /users/new
2026-Jan-07 13:37:03.501544
#14 107.9
2026-Jan-07 13:37:03.501544
#14 107.9
2026-Jan-07 13:37:03.501544
#14 107.9 ƒ Proxy (Middleware)
2026-Jan-07 13:37:03.501544
#14 107.9
2026-Jan-07 13:37:03.501544
#14 107.9 ƒ  (Dynamic)  server-rendered on demand
2026-Jan-07 13:37:03.501544
#14 107.9
2026-Jan-07 13:37:03.749540
#14 DONE 108.3s
2026-Jan-07 13:38:13.551915
#15 [runner 4/6] COPY --from=builder /app ./
2026-Jan-07 13:40:29.321213
#15 DONE 135.8s
2026-Jan-07 13:40:29.478479
#16 [runner 5/6] RUN npm install --omit=dev --no-optional
2026-Jan-07 13:40:29.791386
#16 0.465 npm warn config optional Use `--omit=optional` to exclude optional dependencies, or
2026-Jan-07 13:40:29.791386
#16 0.465 npm warn config `--include=optional` to include them.
2026-Jan-07 13:40:29.791386
#16 0.465 npm warn config
2026-Jan-07 13:40:29.791386
#16 0.465 npm warn config       Default value does install optional deps unless otherwise omitted.
2026-Jan-07 13:44:48.264274
#16 258.9
2026-Jan-07 13:44:48.264274
#16 258.9 > entry-bot@0.1.0 postinstall
2026-Jan-07 13:44:48.264274
#16 258.9 > prisma generate
2026-Jan-07 13:44:48.264274
#16 258.9
2026-Jan-07 13:44:49.199614
#16 259.9 Prisma schema loaded from prisma/schema.prisma
2026-Jan-07 13:44:50.177661
#16 260.9
2026-Jan-07 13:44:50.177661
#16 260.9 ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 461ms
2026-Jan-07 13:44:50.177661
#16 260.9
2026-Jan-07 13:44:50.177661
#16 260.9 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
2026-Jan-07 13:44:50.177661
#16 260.9
2026-Jan-07 13:44:50.177661
#16 260.9 Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
2026-Jan-07 13:44:50.177661
#16 260.9
2026-Jan-07 13:44:50.416180
#16 261.1
2026-Jan-07 13:44:50.416180
#16 261.1 removed 376 packages, and audited 1746 packages in 4m
2026-Jan-07 13:44:50.416180
#16 261.1
2026-Jan-07 13:44:50.416180
#16 261.1 145 packages are looking for funding
2026-Jan-07 13:44:50.416180
#16 261.1   run `npm fund` for details
2026-Jan-07 13:44:51.993987
#16 262.7
2026-Jan-07 13:44:51.993987
#16 262.7 51 moderate severity vulnerabilities
2026-Jan-07 13:44:51.993987
#16 262.7
2026-Jan-07 13:44:51.993987
#16 262.7 To address issues that do not require attention, run:
2026-Jan-07 13:44:51.993987
#16 262.7   npm audit fix
2026-Jan-07 13:44:51.993987
#16 262.7
2026-Jan-07 13:44:51.993987
#16 262.7 To address all issues (including breaking changes), run:
2026-Jan-07 13:44:51.993987
#16 262.7   npm audit fix --force
2026-Jan-07 13:44:51.993987
#16 262.7
2026-Jan-07 13:44:51.993987
#16 262.7 Run `npm audit` for details.
2026-Jan-07 13:44:52.149123
#16 262.7 npm notice
2026-Jan-07 13:44:52.149123
#16 262.7 npm notice New minor version of npm available! 11.6.2 -> 11.7.0
2026-Jan-07 13:44:52.149123
#16 262.7 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
2026-Jan-07 13:44:52.149123
#16 262.7 npm notice To update run: npm install -g npm@11.7.0
2026-Jan-07 13:44:52.149123
#16 262.7 npm notice
2026-Jan-07 13:44:52.528915
#16 DONE 263.2s
2026-Jan-07 13:44:52.698043
#17 [runner 6/6] RUN echo '#!/bin/sh' > start_server.sh &&     echo 'echo "Starting Next.js production server..."' >> start_server.sh &&     echo 'echo "Server will listen on $HOST:$PORT"' >> start_server.sh &&     echo 'exec npm start' >> start_server.sh &&     chmod +x start_server.sh
2026-Jan-07 13:44:52.712872
#17 DONE 0.2s
2026-Jan-07 13:44:52.875279
#18 exporting to image
2026-Jan-07 13:44:52.875279
#18 exporting layers
2026-Jan-07 13:46:10.416280
#18 exporting layers 77.7s done
2026-Jan-07 13:46:10.516392
#18 writing image sha256:2ec5b41bd356f7f665015bc2e224099c1438a1105bf21968bfad1a701a4c232a done
2026-Jan-07 13:46:10.516392
#18 naming to docker.io/library/k8ocgs4kosg88gs48g804g4w:d3536fe25bc664229c503ee53fa394d3aba4a479 0.0s done
2026-Jan-07 13:46:10.516392
#18 DONE 77.7s
2026-Jan-07 13:46:10.569338
Building docker image completed.
2026-Jan-07 13:46:10.665010
Creating .env file with runtime variables for container.
2026-Jan-07 13:46:11.463462
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'cat /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/.env'
2026-Jan-07 13:46:11.463462
SOURCE_COMMIT=d3536fe25bc664229c503ee53fa394d3aba4a479
2026-Jan-07 13:46:11.463462
COOLIFY_URL=https://entrybot.sidattech.com
2026-Jan-07 13:46:11.463462
COOLIFY_FQDN=entrybot.sidattech.com
2026-Jan-07 13:46:11.463462
COOLIFY_BRANCH=main
2026-Jan-07 13:46:11.463462
COOLIFY_RESOURCE_UUID=k8ocgs4kosg88gs48g804g4w
2026-Jan-07 13:46:11.463462
COOLIFY_CONTAINER_NAME=k8ocgs4kosg88gs48g804g4w-132732027141
2026-Jan-07 13:46:11.463462
NEXTAUTH_SECRET=3WBXWv+ZTr+JCBnF5hWCx2FX3WBAE77KqH/cPTRtXw8=
2026-Jan-07 13:46:11.463462
DATABASE_URL=postgres://postgres:<REDACTED>@y0s4ckg8ok8cs0s0k0w4c08c:5432/postgres
2026-Jan-07 13:46:11.463462
NEXTAUTH_URL=https://entrybot.sidattech.com
2026-Jan-07 13:46:11.463462
AWS_REGION=us-east-1
2026-Jan-07 13:46:11.463462
AWS_ACCESS_KEY_ID=YsqlNDkuMt5varnP
2026-Jan-07 13:46:11.463462
AWS_SECRET_ACCESS_KEY=d8PLU9YuWyKxFoWYsLUuOasU2pOzdYVf
2026-Jan-07 13:46:11.463462
AWS_S3_BUCKET_NAME=public-bucket
2026-Jan-07 13:46:11.463462
AWS_S3_ENDPOINT=https://data-entrybot.sidattech.com
2026-Jan-07 13:46:11.463462
OCR_SERVICE_URL=https://paddle-ocr.sidattech.com/process-url
2026-Jan-07 13:46:11.463462
PORT=80
2026-Jan-07 13:46:11.463462
HOST=0.0.0.0
2026-Jan-07 13:46:11.635445
----------------------------------------
2026-Jan-07 13:46:11.656021
Rolling update started.
2026-Jan-07 13:46:12.394953
[CMD]: docker exec x8g0c4gkg8gs8o0ccwos8cgc bash -c 'COOLIFY_URL=https://entrybot.sidattech.com COOLIFY_FQDN=entrybot.sidattech.com COOLIFY_BRANCH=main COOLIFY_RESOURCE_UUID=k8ocgs4kosg88gs48g804g4w  docker compose --project-name k8ocgs4kosg88gs48g804g4w --project-directory /artifacts/x8g0c4gkg8gs8o0ccwos8cgc -f /artifacts/x8g0c4gkg8gs8o0ccwos8cgc/docker-compose.yaml up --build -d'
2026-Jan-07 13:46:12.394953
time="2026-01-07T13:46:12Z" level=warning msg="Found orphan containers ([k8ocgs4kosg88gs48g804g4w-102004243972]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up."
2026-Jan-07 13:46:12.404712
Container k8ocgs4kosg88gs48g804g4w-132732027141  Creating
2026-Jan-07 13:46:12.673654
k8ocgs4kosg88gs48g804g4w-132732027141 Your kernel does not support memory swappiness capabilities or the cgroup is not mounted. Memory swappiness discarded.
2026-Jan-07 13:46:12.688138
Container k8ocgs4kosg88gs48g804g4w-132732027141  Created
2026-Jan-07 13:46:12.688138
Container k8ocgs4kosg88gs48g804g4w-132732027141  Starting
2026-Jan-07 13:46:13.227667
Container k8ocgs4kosg88gs48g804g4w-132732027141  Started
2026-Jan-07 13:46:13.262281
New container started.
2026-Jan-07 13:46:13.283752
Removing old containers.
2026-Jan-07 13:46:17.155904
[CMD]: docker stop -t 30 k8ocgs4kosg88gs48g804g4w-102004243972
2026-Jan-07 13:46:17.155904
k8ocgs4kosg88gs48g804g4w-102004243972
2026-Jan-07 13:46:18.646682
[CMD]: docker rm -f k8ocgs4kosg88gs48g804g4w-102004243972
2026-Jan-07 13:46:18.646682
k8ocgs4kosg88gs48g804g4w-102004243972
2026-Jan-07 13:46:18.657654
Rolling update completed.
2026-Jan-07 13:46:19.360999
Gracefully shutting down build container: x8g0c4gkg8gs8o0ccwos8cgc