$ErrorActionPreference = 'Stop'
$studioRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodeCommand = Get-Command node -ErrorAction Stop
$dataDirectory = Join-Path $studioRoot 'data'
New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null
$logOut = Join-Path $dataDirectory 'worker-host.stdout.log'
$logErr = Join-Path $dataDirectory 'worker-host.stderr.log'
try {
  Invoke-WebRequest -Uri 'http://127.0.0.1:8766/api/worker/status' -TimeoutSec 2 | Out-Null
  Write-Output 'Festival of Bharat local API and worker host are already running at http://127.0.0.1:8766'
  exit 0
} catch { }
Start-Process -FilePath $nodeCommand.Source -ArgumentList @('background-worker.js') -WorkingDirectory $studioRoot -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr
Write-Output 'Started the local API and persistent FFmpeg worker host. The browser is optional; keep this computer awake.'