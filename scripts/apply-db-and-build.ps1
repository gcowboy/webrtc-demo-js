# Apply database migrations and build the project.
# If Prisma generate fails with EPERM: close Cursor/VS Code and any running Backend/Node
# processes, then run this script as Administrator:
#   1. Right-click PowerShell -> "Run as administrator"
#   2. cd "C:\Users\user\Documents\Work\webrtc-demo-js"
#   3. .\scripts\apply-db-and-build.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot + "\.."
$backend = $root + "\Backend"

Write-Host "=== Applying database migrations ===" -ForegroundColor Cyan
Set-Location $backend
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  # P3009: failed migration(s) in DB — mark as rolled back so they can be re-applied
  $status = npx prisma migrate status 2>&1 | Out-String
  if ($status -match "P3009|failed") {
    Write-Host "Resolving failed migration so it can be re-applied..." -ForegroundColor Yellow
    npx prisma migrate resolve --rolled-back "20260306150000_phone_number_profile_name"
    if ($LASTEXITCODE -eq 0) {
      npx prisma migrate deploy
    }
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`n=== Generating Prisma client ===" -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Building project (shared-dto, Backend, Frontend) ===" -ForegroundColor Cyan
Set-Location $root
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Done ===" -ForegroundColor Green
