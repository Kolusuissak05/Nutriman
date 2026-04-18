@echo off
echo.
echo  NutriFlow - Starting up...
echo.

cd /d "%~dp0"

echo  Building frontend...
cd frontend
call npm install
call npm run build
cd ..

echo  Starting server...
cd backend
call npm install
node src/server.js
