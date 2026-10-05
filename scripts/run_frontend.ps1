# Launch Next.js frontend development server
Write-Host "Starting Channel Partner Intelligence Frontend on http://localhost:3000..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\..\frontend"
npm run dev
