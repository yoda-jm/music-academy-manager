#!/bin/sh
set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
node_modules/.bin/prisma generate

echo "Pushing database schema..."
node_modules/.bin/prisma db push --accept-data-loss

echo "Starting application..."
exec npm run start:dev
