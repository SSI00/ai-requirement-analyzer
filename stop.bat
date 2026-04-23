@echo off
chcp 65001 >nul
title AI需求分析系统 - 停止服务

echo ==========================================
echo    AI需求分析系统 - 停止服务
echo ==========================================
echo.

:: 停止 Python (后端)
echo [1/3] 正在停止后端服务 (Python)...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq AI需求分析 - 后端" >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo   [OK] 后端服务已停止

:: 停止 Node.js (前端)
echo.
echo [2/3] 正在停止前端服务 (Node.js)...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq AI需求分析 - 前端" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo   [OK] 前端服务已停止

:: 检查端口
echo.
echo [3/3] 检查端口释放情况...
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo   [OK] 端口 8000 (后端) 已释放
) else (
    echo   [WARN] 端口 8000 仍被占用
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo   [OK] 端口 5173 (前端) 已释放
) else (
    echo   [WARN] 端口 5173 仍被占用
)

echo.
echo ==========================================
echo    所有服务已停止
echo ==========================================
pause
