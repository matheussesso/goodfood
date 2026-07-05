#!/bin/sh
set -e

# Config caches são gerados aqui (no start do container), nunca no build,
# porque dependem de variáveis de ambiente injetadas em runtime (env_file
# do docker-compose de produção).
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Roda migrations só a partir do serviço principal (frankenphp), para o
# scheduler (mesma imagem, command diferente) não disputar a migration
# com o backend na subida simultânea dos containers.
if [ "$1" = "frankenphp" ]; then
    php artisan migrate --force
fi

exec "$@"
