#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready. Running migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate

echo "Starting application..."
exec "$@"
