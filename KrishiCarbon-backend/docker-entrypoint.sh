#!/bin/sh
set -e

echo "==> Deploying Prisma production database migrations..."
npx prisma migrate deploy

if [ $# -eq 0 ]; then
  echo "==> Starting FarmerChoice backend application (node dist/server.js)..."
  exec node dist/server.js
else
  echo "==> Starting FarmerChoice backend application ($@)..."
  exec "$@"
fi
