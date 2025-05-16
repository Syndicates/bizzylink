@echo off
echo Starting MongoDB and Backend API servers...

REM Start MongoDB if not already running
echo Starting MongoDB...
start "MongoDB" "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath="./data"

REM Wait for MongoDB to initialize
echo Waiting for MongoDB to start (5 seconds)...
timeout /t 5 /nobreak > nul

REM Start the backend API server
echo Starting BizzyLink API Server...
start "BizzyLink API" node server.js

REM Wait for backend to initialize
echo Waiting for API server to initialize (3 seconds)...
timeout /t 3 /nobreak > nul

REM Run a quick database check to ensure MongoDB is properly connected
echo Checking database connection...
node -e "const db = require('./db'); db.checkConnection().then(connected => { console.log('Database connected:', connected); process.exit(connected ? 0 : 1); }).catch(err => { console.error('Database connection error:', err); process.exit(1); });"

if %errorlevel% neq 0 (
  echo Database connection failed! Please check MongoDB is running.
  echo You may need to restart the services.
) else (
  echo All backend services started successfully!
  echo MongoDB  : Running
  echo API Server: Running on port 8080
)

echo.
echo Use stop-all.bat to stop all services when done. 