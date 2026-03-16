#!/bin/sh
set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
node_modules/.bin/prisma generate

echo "Pushing database schema..."
node_modules/.bin/prisma db push --accept-data-loss

echo "Seeding static reference data..."
node_modules/.bin/ts-node prisma/seed-static.ts || echo "Static seed skipped (non-fatal)"

echo "Starting application..."
exec npm run start:dev
