$ErrorActionPreference = 'Stop'
$launcher = (Resolve-Path (Join-Path $PSScriptRoot 'start-studio.ps1')).Path
$action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$launcher`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Festival of Bharat AI Studio' -Action $action -Trigger $trigger -Settings $settings -Description 'Starts the local API and persistent FFmpeg worker after user sign-in; no browser is required for queued renders.' -Force | Out-Null
Write-Output 'Registered a per-user startup task. Your PC must be on and awake for queued jobs to run.'