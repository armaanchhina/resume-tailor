#!/bin/sh
echo "Pushing database migrations..."
npx prisma migrate deploy

echo "Regenerating Prisma client..."
npx prisma generate

echo "Starting server..."
npm run dev -- --hostname 0.0.0.0 --port 3000
