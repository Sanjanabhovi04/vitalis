# VITALIS AI STARTUP SCRIPT
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "  VITALIS AI - STARTING SYSTEM" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Dependencies
Write-Host "[1/2] Installing Engine Dependencies..." -ForegroundColor Yellow
Set-Location "C:\Users\bhovi\OneDrive\Desktop\ai-hackthon\frontend"
npm install --quiet

# Start FastAPI Backend in the background
Write-Host "[2/3] Launching Vitalis FastAPI Backend..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --reload --port 8000"

# Step 3: Start Development Server
Write-Host "[3/3] Launching Vitalis Core..." -ForegroundColor Green
Write-Host "Opening browser at http://localhost:3000 in 10 seconds..." -ForegroundColor Gray

# Start dev in background and open browser
Start-Process "http://localhost:3000"
Set-Location "C:\Users\bhovi\OneDrive\Desktop\ai-hackthon\frontend"
npm run dev
