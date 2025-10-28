@echo off
echo Starting Fundraising Portal (Local)

REM Check PostgreSQL (simplified)
echo Checking PostgreSQL connection...
psql -U postgres -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL might not be detected, but continuing anyway...
) else (
    echo PostgreSQL is running
)


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