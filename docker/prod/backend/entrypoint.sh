#!/bin/sh
set -e

# Config caches are generated here (at container startup), never at build time,
# because they depend on environment variables injected at runtime (env_file
# from production docker-compose).
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Pet photos/documents live in storage/app/public (persistent volume), but the
# public/storage symlink lives in the container layer and is lost on recreate.
# --force keeps this idempotent across plain container restarts.
mkdir -p storage/app/public
php artisan storage:link --force

# Run migrations only from the main service (frankenphp), so the
# scheduler (same image, different command) does not race migrations
# with the backend during simultaneous container startup.
if [ "$1" = "frankenphp" ]; then
    php artisan migrate --force
fi

exec "$@"
