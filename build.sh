#!/bin/bash

# Exit if any command fails
set -e

echo "Installing root dependencies..."
npm install

echo "Installing Backend dependencies..."
cd Backend
npm install
cd ..

echo "Installing Frontend dependencies..."
cd Frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
