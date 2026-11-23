FROM php:8.5-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system utilities
RUN apk add --no-cache git curl zip unzip

# Install official extension installer tool
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Install PHP extensions cleanly & safely
RUN install-php-extensions \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    gd \
    intl \
    opcache \
    redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy custom php.ini configuration
COPY docker/php/local.ini /usr/local/etc/php/conf.d/local.ini

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]
