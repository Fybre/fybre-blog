#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads
chown -R nextjs:nodejs /app/data /app/public/uploads

exec su-exec nextjs "$@"
