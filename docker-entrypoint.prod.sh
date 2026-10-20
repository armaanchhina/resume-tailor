#!/bin/sh
set -e

# Migrations are NOT run here on purpose -- see DEPLOYMENT.md's "Running
# migrations" section. Run `npx prisma migrate deploy` as a one-time
# pre-deploy/release step instead (e.g. Render's Pre-Deploy Command), so it
# runs exactly once per deploy rather than on every container start/restart,
# and a failed migration doesn't crash-loop a running app.

echo "Starting server..."
# `next start` binds to 0.0.0.0 and reads $PORT automatically -- this is
# what Render/Railway/Fly expect (they assign PORT at runtime).
exec npm run start
