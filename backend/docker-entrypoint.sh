#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🔍 Diagnosing connection variables..."
node -e "
const url = process.env.DATABASE_URL;
if (!url) {
  console.log('❌ DATABASE_URL is UNDEFINED or EMPTY in Render environment variables!');
} else {
  try {
    const parsed = new URL(url);
    console.log('✅ DATABASE_URL detected. Host:', parsed.hostname, 'Port:', parsed.port || '5432', 'DB Name:', parsed.pathname);
  } catch (e) {
    console.log('❌ DATABASE_URL exists but failed URL parsing! Error:', e.message);
  }
}
"

echo "🚀 Running database migrations..."
if npx -y prisma migrate deploy; then
  echo "✅ Migrations completed successfully!"
else
  echo "❌ Migrations failed! Please check your DATABASE_URL environment variable."
  exit 1
fi

echo "🔥 Starting the application..."
exec npm run start
