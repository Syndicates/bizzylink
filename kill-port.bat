@echo off
setlocal enabledelayedexpansion

echo ================================================
echo Port Killer Utility
echo ================================================

set PORT=%1

if "%PORT%"=="" (
    echo No port specified! Usage: kill-port.bat [PORT]
    echo Example: kill-port.bat 8080
    goto :EOF
)

echo Looking for processes using port %PORT%...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo Found process with PID: !PID!
        
        for /f "tokens=1" %%b in ('tasklist /fi "PID eq !PID!" ^| findstr "."') do (
            set PROCESS_NAME=%%b
            echo Process name: !PROCESS_NAME!
            
            echo Killing process !PID! (!PROCESS_NAME!)...
            taskkill /F /PID !PID!
            
            if !ERRORLEVEL! EQU 0 (
                echo Process successfully terminated.
            ) else (
                echo Failed to terminate process. You may need to run as administrator.
            )
        )
    )
)

echo.
echo Port %PORT% should now be free.
echo ================================================

pause