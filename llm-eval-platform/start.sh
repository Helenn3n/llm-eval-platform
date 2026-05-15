#!/bin/bash

# LLM Evaluation Platform Startup Script
# This script builds and starts the application in production mode

set -e

echo "=========================================="
echo "  LLM Evaluation Platform - Demo"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    echo "[INFO] Dependencies installed."
    echo ""
fi

# Build the application
echo "[INFO] Building application..."
npm run build
echo "[INFO] Build completed."
echo ""

# Start the preview server
echo "[INFO] Starting server on port 7892..."
echo "[INFO] Access the application at: http://localhost:7892"
echo "[INFO] Press Ctrl+C to stop the server"
echo ""
npm run preview
