# File: backend/start.ps1

# ================================================
# GenAI Customer Support - Stable Startup Script
# Correct Ollama detection + no false negatives
# ================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GenAI Support - Starting Project..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------
# CONFIG
# ------------------------------------------------
$OLLAMA_URL = "http://localhost:11434"
$OLLAMA_MODEL = "mistral"
$MAX_RETRIES = 30
$RETRY_DELAY = 2

$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path (Split-Path -Parent $backendPath) "frontend"

# ------------------------------------------------
# STEP 1: Check Ollama (robust, no HTTP parsing issues)
# ------------------------------------------------
Write-Host "[1/5] Checking Ollama..." -ForegroundColor Yellow

$ollamaReady = $false

try {
    $tcp = Test-NetConnection -ComputerName localhost -Port 11434 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) {
        $ollamaReady = $true
    }
} catch {}

if ($ollamaReady) {
    Write-Host "      Ollama is running." -ForegroundColor Green
} else {
    Write-Host "      Ollama not running. Start it manually." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------
# STEP 2: Warm up model
# ------------------------------------------------
Write-Host "[2/5] Warming up model ($OLLAMA_MODEL)..." -ForegroundColor Yellow

try {
    Invoke-RestMethod -Uri "$OLLAMA_URL/api/generate" `
        -Method Post `
        -Body (@{
            model  = $OLLAMA_MODEL
            prompt = "hello"
            stream = $false
        } | ConvertTo-Json -Depth 5) `
        -ContentType "application/json" `
        -TimeoutSec 180 | Out-Null

    Write-Host "      Model warmed up." -ForegroundColor Green
} catch {
    Write-Host "      WARNING: Warmup failed." -ForegroundColor DarkYellow
}

# ------------------------------------------------
# STEP 3: Start Backend
# ------------------------------------------------
Write-Host "[3/5] Starting FastAPI backend..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    @"
Write-Host 'BACKEND' -ForegroundColor Cyan
cd '$backendPath'

if (!(Test-Path ".\.venv")) {
    Write-Host 'Creating virtual environment...' -ForegroundColor Yellow
    python -m venv .venv
}

.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn app.main:app --reload
"@
)

# Wait for backend
Write-Host "      Waiting for backend..." -ForegroundColor DarkYellow

$retry = 0
$backendReady = $false

while (-not $backendReady -and $retry -lt $MAX_RETRIES) {
    try {
        Invoke-RestMethod -Uri "http://localhost:8000/docs" -TimeoutSec 2 | Out-Null
        $backendReady = $true
    } catch {
        Start-Sleep -Seconds $RETRY_DELAY
        $retry++
    }
}

if ($backendReady) {
    Write-Host "      Backend is ready." -ForegroundColor Green
} else {
    Write-Host "      WARNING: Backend not confirmed ready." -ForegroundColor DarkYellow
}

# ------------------------------------------------
# STEP 4: Start Frontend
# ------------------------------------------------
Write-Host "[4/5] Starting React frontend..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    @"
Write-Host 'FRONTEND' -ForegroundColor Magenta
cd '$frontendPath'
npm install
npm run dev
"@
)

Start-Sleep -Seconds 2
Write-Host "      Frontend starting at http://localhost:5173" -ForegroundColor Green

# ------------------------------------------------
# DONE
# ------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Ollama  -> http://localhost:11434"        -ForegroundColor White
Write-Host "  Backend -> http://localhost:8000"         -ForegroundColor White
Write-Host "  Docs    -> http://localhost:8000/docs"    -ForegroundColor White
Write-Host "  App     -> http://localhost:5173/login"   -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")