#!/bin/bash

# Start the React frontend
echo "Starting BizzyLink React Frontend..."
echo ""
echo "This script will start the React frontend server on port 3000"
echo "To access the frontend, open http://localhost:3000 in your browser"
echo ""

# Go to the React frontend directory
cd react-frontend

# Install dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Set development environment variables
export NODE_ENV=development

# Start the React frontend in development mode
echo "Starting React frontend..."
npm start