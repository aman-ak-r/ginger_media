# --- Build Stage ---
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies (needed for native modules like sharp/sharp-phash if compiling)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma.config.* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install system dependencies for Sharp/Canvas/Exif if needed (libc6-compat equivalents)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma.config.* ./
COPY prisma ./prisma/
COPY public ./public

# Install only production dependencies
RUN npm ci --only=production

# Copy generated Prisma Client and compiled code from builder
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose API port
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
