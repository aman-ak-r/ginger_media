#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Running database migrations..."
npx -y prisma migrate deploy

echo "🔥 Starting the application..."
exec npm run start
