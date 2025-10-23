#!/bin/sh
echo "Pushing database migrations..."
npx prisma db push 

echo "Starting server..."
npm run dev