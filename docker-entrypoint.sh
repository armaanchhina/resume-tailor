#!/bin/sh
echo "Pushing database migrations..."
npx prisma migrate deploy

echo "Starting server..."
npm run dev