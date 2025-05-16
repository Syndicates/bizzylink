@echo off
echo Starting BizzyLink Servers...
start "BizzyLink Enhanced Server" cmd /c "node enhanced-server.js"
echo Enhanced server started in a new window.
echo.
echo Starting main server...
start "BizzyLink Main Server" cmd /c "node server.js"
echo Main server started in a new window.
echo.
echo Starting direct authentication server...
start "BizzyLink Direct Auth Server" cmd /c "node direct-auth-server.js"
echo Direct Auth server started in a new window.
echo.
echo Starting player stats server...
start "BizzyLink Player Stats Server" cmd /c "node player-stats-server.js"
echo Player stats server started in a new window.
echo.
echo All servers are now running. Close this window to exit.
pause 