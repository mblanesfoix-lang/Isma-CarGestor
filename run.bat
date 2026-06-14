@echo off
title Car Gestor - Servidor Local
cd /d "%~dp0"

echo ==========================================
echo  CAR GESTOR - Iniciando servidor local...
echo ==========================================
echo.

echo Iniciando Car Gestor en http://localhost:3000
echo  - El navegador se abrira automaticamente
echo  - Cierra esta ventana para detener el servidor
echo.
start "Car Gestor API" cmd /c "node electron/start-server.js"
call npm run react-start

pause
