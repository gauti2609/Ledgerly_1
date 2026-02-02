@echo off
echo ==========================================
echo Starting Ledgerly Review Project Services
echo ==========================================

echo.
echo 1. Starting Backend (Port 8005)...
start "Ledgerly Backend" cmd /k "cd backend && npm run start:dev"

echo.
echo 2. Starting Frontend (Port 3005)...
start "Ledgerly Frontend" cmd /k "npm run dev"

echo.
echo 3. Starting Ngrok (Port 3005)...
start "Ngrok Tunnel" cmd /k "npx ngrok http 3005"

echo.
echo ==========================================
echo All services have been triggered.
echo Please check the opened windows for logs.
echo ==========================================
pause
