#!/bin/bash

# Perform git pull
echo "Performing git pull..."
git pull origin develop

# Install npm dependencies
echo "Installing npm dependencies..."
npm install -f

# Install Composer dependencies
echo "Installing Composer dependencies..."
composer install --no-interaction --prefer-dist

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# Build the frontend with npm
echo "Building the frontend..."
npm run build

# Clear caches if necessary
echo "Clearing application cache..."
php artisan optimize:clear

echo "Deployment completed successfully."
