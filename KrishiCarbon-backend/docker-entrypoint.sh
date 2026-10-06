#!/bin/sh
set -e

echo "==> Deploying Prisma production database migrations..."
npx prisma migrate deploy

if [ $# -eq 0 ]; then
  echo "==> Starting KrishiCarbon backend application (node dist/server.js)..."
  exec node dist/server.js
else
  echo "==> Starting KrishiCarbon backend application ($@)..."
  exec "$@"
fi
