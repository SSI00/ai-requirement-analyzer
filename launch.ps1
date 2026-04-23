#Requires -Version 5.1
<#
.SYNOPSIS
    AI需求分析系统 - 一键启动脚本 (PowerShell)
.DESCRIPTION
    自动完成以下操作：
    1. 检查环境 (Python/Node.js)
    2. 检查 .env 配置
    3. 安装缺失依赖
    4. 启动后端服务 (FastAPI)
    5. 启动前端服务 (React/Vite)
    6. 自动打开浏览器访问系统
.NOTES
    版本: 1.1
    日期: 2026-04-22
#>

# 设置编码和标题
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AI需求分析系统 - 启动器"

# 颜色定义
$ColorInfo    = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError   = "Red"
$ColorTitle   = "Magenta"

# 项目路径
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $ProjectRoot "backend"
$FrontendPath = Join-Path $ProjectRoot "frontend"
$EnvFile = Join-Path $BackendPath ".env"

# 端口配置
$BackendPort = 8000
$FrontendPort = 5173
$BackendUrl = "http://localhost:$BackendPort"
$FrontendUrl = "http://localhost:$FrontendPort"

# ============================================
# 辅助函数
# ============================================

function Write-Step {
    param([int]$Step, [int]$Total, [string]$Message)
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor $ColorTitle
}

function Write-Status {
    param([string]$Type, [string]$Message)
    switch ($Type) {
        "OK"     { Write-Host "  [OK] $Message" -ForegroundColor $ColorSuccess }
        "WARN"   { Write-Host "  [WARN] $Message" -ForegroundColor $ColorWarning }
        "ERROR"  { Write-Host "  [ERROR] $Message" -ForegroundColor $ColorError }
        "INFO"   { Write-Host "  [INFO] $Message" -ForegroundColor $ColorInfo }
        default  { Write-Host "  $Message" }
    }
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-ForService {
    param([string]$Url, [int]$TimeoutSeconds = 60, [string]$ServiceName)
    $startTime = Get-Date
    Write-Status "INFO" "等待 $ServiceName 启动..."
    
    while ($true) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            # 继续等待
        }
        
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -gt $TimeoutSeconds) {
            return $false
        }
        
        Start-Sleep -Milliseconds 500
        Write-Host "." -NoNewline -ForegroundColor $ColorInfo
    }
}

function Stop-ExistingProcess {
    param([int]$Port)
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
               Select-Object -First 1 | 
               ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
    if ($process) {
        Write-Status "WARN" "端口 $Port 被占用 (PID: $($process.Id))，正在停止..."
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# ============================================
# 启动流程
# ============================================

Clear-Host
Write-Host "==========================================" -ForegroundColor $ColorTitle
Write-Host "    AI需求分析系统 - 一键启动器" -ForegroundColor $ColorTitle
Write-Host "==========================================" -ForegroundColor $ColorTitle

$TotalSteps = 7

# ---------- Step 1: 检查Python ----------
Write-Step -Step 1 -Total $TotalSteps -Message "检查 Python 环境"
if (-not (Test-CommandExists "python")) {
    Write-Status "ERROR" "未检测到 Python，请先安装 Python 3.9+"
    Write-Host ""
    Write-Host "下载地址: https://www.python.org/downloads/" -ForegroundColor $ColorWarning
    Read-Host "按 Enter 键退出"
    exit 1
}
$pythonVersion = (python --version 2>&1).ToString()
Write-Status "OK" "检测到 $pythonVersion"

# ---------- Step 2: 检查Node.js ----------
Write-Step -Step 2 -Total $TotalSteps -Message "检查 Node.js 环境"
if (-not (Test-CommandExists "node")) {
    Write-Status "ERROR" "未检测到 Node.js，请先安装 Node.js 18+"
    Write-Host ""
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor $ColorWarning
    Read-Host "按 Enter 键退出"
    exit 1
}
$nodeVersion = (node --version).ToString()
Write-Status "OK" "检测到 Node.js $nodeVersion"

# ---------- Step 3: 检查 .env 配置 ----------
Write-Step -Step 3 -Total $TotalSteps -Message "检查环境变量配置"
if (-not (Test-Path $EnvFile)) {
    $EnvExample = Join-Path $BackendPath ".env.example"
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Status "WARN" "已自动创建 .env 文件（从模板复制）"
    } else {
        Write-Status "ERROR" "未找到 .env 和 .env.example 文件"
        Read-Host "按 Enter 键退出"
        exit 1
    }
}

# 读取并检查 API Key
$envContent = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue
if ($envContent -match "OPENAI_API_KEY\s*=\s*your_openai_api_key_here" -or 
    $envContent -notmatch "OPENAI_API_KEY\s*=\s*sk-") {
    Write-Status "WARN" "OpenAI API Key 未配置或仍为默认值"
    Write-Host ""
    Write-Host "请编辑以下文件，填入有效的 OpenAI API Key:" -ForegroundColor $ColorWarning
    Write-Host "  $EnvFile" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "格式示例:" -ForegroundColor $ColorWarning
    Write-Host "  OPENAI_API_KEY=sk-your-actual-api-key-here" -ForegroundColor $ColorInfo
    Write-Host ""
    
    $continue = Read-Host "是否仍要继续启动? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Status "INFO" "已取消启动"
        exit 0
    }
} else {
    Write-Status "OK" "环境变量配置已就绪"
}

# ---------- Step 4: 安装后端依赖 ----------
Write-Step -Step 4 -Total $TotalSteps -Message "检查并安装后端依赖"
Set-Location $BackendPath

# 先检查关键依赖是否已安装
try {
    python -c "import fastapi, uvicorn, pydantic, openai, httpx" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "OK" "后端依赖已安装，跳过"
    } else {
        throw "依赖缺失"
    }
} catch {
    Write-Status "INFO" "检测到依赖缺失，开始安装..."
    $pipOutput = python -m pip install -r requirements.txt 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR" "后端依赖安装失败"
        Write-Host $pipOutput -ForegroundColor $ColorError
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Write-Status "OK" "后端依赖安装完成"
}

# ---------- Step 5: 安装前端依赖 ----------
Write-Step -Step 5 -Total $TotalSteps -Message "检查并安装前端依赖"
Set-Location $FrontendPath
if (-not (Test-Path "node_modules")) {
    Write-Status "INFO" "首次运行，正在安装前端依赖（可能需要几分钟）..."
    $npmOutput = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Status "ERROR" "前端依赖安装失败"
        Write-Host $npmOutput -ForegroundColor $ColorError
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Write-Status "OK" "前端依赖安装完成"
} else {
    Write-Status "OK" "前端依赖已存在，跳过安装"
}

# ---------- Step 6: 启动服务 ----------
Write-Step -Step 6 -Total $TotalSteps -Message "启动服务"

# 检查并释放端口
Stop-ExistingProcess -Port $BackendPort
Stop-ExistingProcess -Port $FrontendPort

# 启动后端
Write-Status "INFO" "正在启动后端服务 (端口 $BackendPort)..."
$backendCmd = "cd `""$BackendPath`""; python -m uvicorn app.main:app --host 0.0.0.0 --port $BackendPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# 等待后端就绪
$backendReady = Wait-ForService -Url "$BackendUrl/api/v1/requirements/health" -TimeoutSeconds 30 -ServiceName "后端服务"
if (-not $backendReady) {
    Write-Status "ERROR" "后端服务启动超时"
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Status "OK" "后端服务已就绪: $BackendUrl"

# 启动前端
Write-Status "INFO" "正在启动前端服务 (端口 $FrontendPort)..."
$frontendCmd = "cd `""$FrontendPath`""; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

# 等待前端就绪
$frontendReady = Wait-ForService -Url $FrontendUrl -TimeoutSeconds 60 -ServiceName "前端服务"
if (-not $frontendReady) {
    Write-Status "WARN" "前端服务启动超时，可能需要更长时间"
} else {
    Write-Status "OK" "前端服务已就绪: $FrontendUrl"
}

# ---------- Step 7: 打开浏览器 ----------
Write-Step -Step 7 -Total $TotalSteps -Message "打开浏览器"
Write-Status "INFO" "正在打开浏览器..."
Start-Sleep -Seconds 2

try {
    Start-Process $FrontendUrl
    Write-Status "OK" "浏览器已打开"
} catch {
    Write-Status "WARN" "自动打开浏览器失败，请手动访问: $FrontendUrl"
}

# ============================================
# 完成
# ============================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorSuccess
Write-Host "    服务启动完成！" -ForegroundColor $ColorSuccess
Write-Host "==========================================" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  前端界面: " -NoNewline; Write-Host $FrontendUrl -ForegroundColor $ColorInfo
Write-Host "  API文档:  " -NoNewline; Write-Host "$BackendUrl/docs" -ForegroundColor $ColorInfo
Write-Host "  健康检查: " -NoNewline; Write-Host "$BackendUrl/api/v1/requirements/health" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  后端窗口和前端窗口已单独打开" -ForegroundColor $ColorWarning
Write-Host "  关闭对应窗口即可停止服务" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "==========================================" -ForegroundColor $ColorSuccess

Read-Host "按 Enter 键关闭此窗口"
