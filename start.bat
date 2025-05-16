@echo off
setlocal EnableDelayedExpansion

echo =================================================
echo 🚀 Starting BizzyLink...
echo =================================================

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if required node modules are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Build the CSS files
echo 📦 Building CSS...
call npx tailwindcss -i .\public\styles.css -o .\public\output.css
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to build CSS
    pause
    exit /b 1
)

:: Create public/minecraft-assets directory if it doesn't exist
if not exist "public\minecraft-assets" (
    echo 📁 Creating minecraft-assets directory...
    mkdir "public\minecraft-assets"
)

:: Ensure all SVG files exist in the public/minecraft-assets directory
if not exist "public\minecraft-assets\grass-block.svg" (
    echo 🖼️ Missing SVG files, copying...
    copy "minecraft-assets\*.svg" "public\minecraft-assets\"
)

:: Create fonts directory if it doesn't exist
if not exist "public\fonts" (
    echo 📁 Creating fonts directory...
    mkdir "public\fonts"
)

:: Download Minecraft font if it doesn't exist
if not exist "public\fonts\minecraft-ten.woff" (
    echo 📥 Downloading Minecraft font...
    curl -s -o "public\fonts\minecraft-ten.woff" "https://cdn.jsdelivr.net/gh/South-Paw/typeface-minecraft@master/font/minecraft-ten.woff"
    if %ERRORLEVEL% neq 0 (
        echo ⚠️ Failed to download font, but continuing...
    )
)

:: Kill any process using port 8080 before starting
echo 🔄 Checking for processes using port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo Found process !PID! using port 8080, killing it...
        taskkill /F /PID !PID! >nul 2>&1
    )
)

echo.
echo 🌐 Starting backend server...
echo.
echo ✅ BizzyLink is now running!
echo 📋 Access the app at: http://localhost:8080
echo ⚠️  Press Ctrl+C to stop the server
echo.
echo =================================================
echo.

node server.js