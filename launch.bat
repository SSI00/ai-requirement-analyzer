@echo off
chcp 65001 >nul
title AI需求分析系统 - 一键启动器

:: ==========================================
:: AI需求分析系统 - 一键启动脚本
:: 功能: 检查环境 -> 安装依赖 -> 启动服务 -> 打开浏览器
:: ==========================================

echo ==========================================
echo    AI需求分析系统 - 一键启动器
echo ==========================================
echo.

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "ENV_FILE=%BACKEND_DIR%\.env"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"

:: ---------- Step 1: 检查Python ----------
echo [1/7] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] 未检测到 Python，请先安装 Python 3.9+
    echo   下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('python --version 2^>^&1') do echo   [OK] 检测到 %%a

:: ---------- Step 2: 检查Node.js ----------
echo.
echo [2/7] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo   [ERROR] 未检测到 Node.js，请先安装 Node.js 18+
    echo   下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('node --version') do echo   [OK] 检测到 Node.js %%a

:: ---------- Step 3: 检查 .env 配置 ----------
echo.
echo [3/7] 检查环境变量配置...
if not exist "%ENV_FILE%" (
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%ENV_FILE%" >nul
        echo   [WARN] 已自动创建 .env 文件（从模板复制）
    ) else (
        echo   [ERROR] 未找到 .env 和 .env.example 文件
        pause
        exit /b 1
    )
)

:: 简单检查 API Key
findstr /C:"OPENAI_API_KEY=sk-" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 (
    echo   [WARN] OpenAI API Key 未配置或仍为默认值
    echo.
    echo   请编辑以下文件，填入有效的 OpenAI API Key:
    echo     %ENV_FILE%
    echo.
    echo   格式示例:
    echo     OPENAI_API_KEY=sk-your-actual-api-key-here
    echo.
    set /p CONTINUE="是否仍要继续启动? (y/n): "
    if /I not "%CONTINUE%"=="y" (
        echo   [INFO] 已取消启动
        exit /b 0
    )
) else (
    echo   [OK] 环境变量配置已就绪
)

:: ---------- Step 4: 安装后端依赖 ----------
echo.
echo [4/7] 检查并安装后端依赖...
cd /d "%BACKEND_DIR%"

:: 先检查关键依赖是否已安装
python -c "import fastapi, uvicorn, pydantic, openai, httpx" >nul 2>&1
if errorlevel 1 (
    echo   [INFO] 检测到依赖缺失，开始安装...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo   [ERROR] 后端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo   [OK] 后端依赖已安装，跳过
)

:: ---------- Step 5: 安装前端依赖 ----------
echo.
echo [5/7] 检查并安装前端依赖...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo   [INFO] 首次运行，正在安装前端依赖（可能需要几分钟）...
    call npm install
    if errorlevel 1 (
        echo   [ERROR] 前端依赖安装失败
        pause
        exit /b 1
    )
    echo   [OK] 前端依赖安装完成
) else (
    echo   [OK] 前端依赖已存在，跳过安装
)

:: ---------- Step 6: 启动服务 ----------
echo.
echo [6/7] 启动服务...

:: 启动后端
echo   [INFO] 正在启动后端服务 (端口 %BACKEND_PORT%)...
start "AI需求分析 - 后端" cmd /k "cd /d "%BACKEND_DIR%" && python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT%"

:: 等待后端启动
echo   [INFO] 等待后端服务就绪...
:WAIT_BACKEND
timeout /t 1 >nul
curl -s http://localhost:%BACKEND_PORT%/api/v1/requirements/health >nul 2>&1
if errorlevel 1 (
    goto WAIT_BACKEND
)
echo   [OK] 后端服务已就绪: http://localhost:%BACKEND_PORT%

:: 启动前端
echo   [INFO] 正在启动前端服务 (端口 %FRONTEND_PORT%)...
start "AI需求分析 - 前端" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

:: 等待前端启动
echo   [INFO] 等待前端服务就绪...
:WAIT_FRONTEND
timeout /t 2 >nul
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if errorlevel 1 (
    goto WAIT_FRONTEND
)
echo   [OK] 前端服务已就绪: http://localhost:%FRONTEND_PORT%

:: ---------- Step 7: 打开浏览器 ----------
echo.
echo [7/7] 打开浏览器...
timeout /t 2 >nul
start http://localhost:%FRONTEND_PORT%
echo   [OK] 浏览器已打开

:: ==========================================
:: 完成
:: ==========================================
echo.
echo ==========================================
echo    服务启动完成！
echo ==========================================
echo.
echo   前端界面: http://localhost:%FRONTEND_PORT%
echo   API文档:  http://localhost:%BACKEND_PORT%/docs
echo   健康检查: http://localhost:%BACKEND_PORT%/api/v1/requirements/health
echo.
echo   后端窗口和前端窗口已单独打开
echo   关闭对应窗口即可停止服务
echo.
echo ==========================================

pause
