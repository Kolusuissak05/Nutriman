#!/bin/bash
echo ""
echo "  NutriFlow - Starting up..."
echo ""

cd "$(dirname "$0")"

echo "  Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "  Starting server..."
cd backend
npm install
node src/server.js
