#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Running database migrations..."
if npx -y prisma migrate deploy; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migrations failed! Please check your DATABASE_URL environment variable."
  exit 1
fi

echo "🔥 Starting the application..."
exec npm run start
