param(
  [switch]$Launch
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $root "src-tauri\target\release"
$artifacts = @(
  (Join-Path $releaseDir "bundle\msi\PromptBridge_0.1.0_x64_en-US.msi"),
  (Join-Path $releaseDir "bundle\nsis\PromptBridge_0.1.0_x64-setup.exe"),
  (Join-Path $releaseDir "promptbridge.exe")
)

Write-Host "PromptBridge Windows release smoke test"
Write-Host "Root: $root"
Write-Host ""

foreach ($path in $artifacts) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing expected artifact: $path"
  }
}

$results = foreach ($path in $artifacts) {
  $item = Get-Item -LiteralPath $path
  $hash = Get-FileHash -LiteralPath $path -Algorithm SHA256

  [pscustomobject]@{
    Artifact = $item.Name
    SizeMB = [math]::Round($item.Length / 1MB, 2)
    SHA256 = $hash.Hash
    Path = $item.FullName
  }
}

$results | Format-Table -AutoSize

if ($Launch) {
  $exePath = Join-Path $releaseDir "promptbridge.exe"
  Write-Host ""
  Write-Host "Launching: $exePath"
  Start-Process -FilePath $exePath
}

Write-Host ""
Write-Host "Smoke test passed."
