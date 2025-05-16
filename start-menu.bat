@echo off
setlocal EnableDelayedExpansion

echo =================================================
echo 🚀 BizzyLink Launcher
echo =================================================
echo.
echo Choose which version to run:
echo.
echo 1) JavaScript Version (Stable - Current Implementation)
echo 2) React Version (Not Implemented - Development Only)
echo.

set /p CHOICE="Enter your choice (1 or 2): "

if "%CHOICE%"=="2" (
    echo.
    echo 🚧 Starting React Development Environment...
    echo.
    
    cd react-frontend
    
    if not exist "node_modules" (
        echo 📦 Installing React dependencies (this may take a while)...
        call npm install
        if %ERRORLEVEL% neq 0 (
            echo ❌ Failed to install React dependencies
            pause
            exit /b 1
        )
    )
    
    echo.
    echo ⚠️ The React frontend is not fully implemented yet.
    echo 🔨 You will need to build the React components.
    echo 🌐 The React development server will start on port 3000.
    echo 🌐 You'll still need to start the backend server separately.
    echo.
    echo 🚀 Starting React development server...
    echo.
    
    start cmd /k npm start
    
    echo.
    echo ✅ React development server started!
    echo 📋 In a separate terminal, run 'start.bat' to start the backend.
    echo.
    
) else (
    echo.
    echo 🚀 Starting JavaScript version...
    echo.
    
    call start.bat
)

pause