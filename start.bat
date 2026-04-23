@echo off
chcp 65001 >nul
echo ==========================================
echo    AI需求分析系统 - 启动脚本
echo ==========================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.9+
    pause
    exit /b 1
)

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js，请先安装Node.js 18+
    pause
    exit /b 1
)

REM 检查环境变量
if not exist backend\.env (
    echo [警告] 未找到 backend\.env 文件
    echo 请复制 backend\.env.example 为 backend\.env 并配置您的OpenAI API Key
    pause
    exit /b 1
)

echo [1/4] 安装后端依赖...
cd backend
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo [1/4] 后端依赖安装完成

echo [2/4] 安装前端依赖...
cd ..\frontend
call npm install >nul 2>&1
if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo [2/4] 前端依赖安装完成

echo [3/4] 启动后端服务...
cd ..\backend
start "AI需求分析 - 后端" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo [3/4] 后端服务已启动 (http://localhost:8000)
timeout /t 3 >nul

echo [4/4] 启动前端服务...
cd ..\frontend
start "AI需求分析 - 前端" cmd /k "npm run dev"
echo [4/4] 前端服务已启动 (http://localhost:5173)

echo.
echo ==========================================
echo    服务启动完成！
echo ==========================================
echo 后端API: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo 前端界面: http://localhost:5173
echo.
echo 按任意键关闭此窗口（服务将继续在后台运行）
pause >nul
