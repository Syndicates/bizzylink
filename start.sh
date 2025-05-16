#!/bin/bash
# BizzyLink startup script

echo "🚀 Starting BizzyLink..."

# Build the CSS files
echo "📦 Building CSS..."
npx tailwindcss -i ./public/styles.css -o ./public/output.css

# Start the server in the background
echo "🌐 Starting backend server..."
node server.js &
SERVER_PID=$!

# Trap to ensure clean shutdown
cleanup() {
  echo "🛑 Shutting down BizzyLink..."
  kill $SERVER_PID
  exit 0
}

trap cleanup SIGINT SIGTERM

# Display server info
echo ""
echo "✅ BizzyLink is now running!"
echo "📋 Backend URL: http://localhost:8080"
echo "📋 Frontend URL: http://localhost:8080"
echo "⚠️  Press Ctrl+C to stop the server"
echo ""

# Wait for interrupt
wait