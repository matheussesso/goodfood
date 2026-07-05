FROM dunglas/frankenphp:1-php8.4

# Instalar dependências de sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar extensões PHP usando script do FrankenPHP
RUN install-php-extensions \
    pdo_pgsql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip

# Obter o Composer mais recente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Definir o diretório de trabalho
WORKDIR /app

# Copiar a configuração do Caddy
COPY docker/backend/Caddyfile /etc/caddy/Caddyfile

# Ajustar permissões para o usuário da aplicação (opcional para dev)
RUN chown -R www-data:www-data /app
