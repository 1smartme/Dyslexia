@echo off
echo ========================================
echo    DysLexia Support Platform
echo ========================================
echo.
echo Starting backend server...
cd backend
start "Backend Server" cmd /k "echo Backend Server Started && node server.js"
echo.
echo Starting frontend application...
cd ..
timeout /t 3 /nobreak > nul
start "Frontend App" cmd /k "echo Frontend App Started && npm start"
echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin: http://localhost:3000/database
echo.
echo Press any key to exit...
pause > nul