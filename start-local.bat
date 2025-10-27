@echo off
echo Starting Fundraising Portal (Local)

REM Check PostgreSQL
pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL is not running. Please start it first.
    echo Check Windows Services for postgresql service
    pause
    exit /b 1
)

echo PostgreSQL is running

REM Start backend
echo Starting backend server...
start "Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit
timeout /t 5 /nobreak

REM Start frontend
echo Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application started!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers
pause