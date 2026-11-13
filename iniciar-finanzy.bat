@echo off
title Finanzy - Servidor Backend (Spring Boot) + PWA (Vue 3)
echo =========================================================
echo   Iniciando FINANZY - Control de Gastos PWA (Java + Vue)
echo =========================================================

if exist "%USERPROFILE%\.jdks\jbr-17.0.14" (
    set "JAVA_HOME=%USERPROFILE%\.jdks\jbr-17.0.14"
)

echo [1/2] Iniciando Backend Spring Boot en http://localhost:8080 ...
start "Finanzy Backend (Spring Boot)" cmd /k "set JAVA_HOME=%JAVA_HOME% && mvnw.cmd spring-boot:run"

echo [2/2] Iniciando Frontend Vue 3 PWA en http://localhost:5173 ...
cd frontend
start "Finanzy Frontend (Vue 3 Vite)" cmd /k "npm run dev"

echo.
echo Servidores lanzados!
echo - App modo desarrollo (Hot Reload): http://localhost:5173
echo - App integrada en Spring Boot:     http://localhost:8080
pause
