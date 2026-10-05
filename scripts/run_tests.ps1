# Run complete backend and frontend test suites with quality gates (>85% coverage)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Running Backend Tests & Coverage Check..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\backend"
.\.venv\Scripts\python.exe -m pytest tests --cov=app --cov-report=term-missing --cov-fail-under=85
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Running Frontend Tests & Coverage Check..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
npm run test:coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll Quality Gates Passed (>85% Coverage)!" -ForegroundColor Green
