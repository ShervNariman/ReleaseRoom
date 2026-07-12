param(
  [string]$Root = "C:\Projects",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/ShervNariman/ReleaseRoom.git"
$target = Join-Path $Root "ReleaseRoom"

New-Item -ItemType Directory -Force -Path $Root | Out-Null

if (Test-Path $target) {
  if (-not (Test-Path (Join-Path $target ".git"))) {
    throw "The target exists but is not a Git repository: $target"
  }

  $origin = (git -C $target remote get-url origin).Trim()
  if ($origin -notmatch "ShervNariman/ReleaseRoom(\.git)?$") {
    throw "Refusing to use $target because origin is $origin"
  }

  git -C $target pull --ff-only origin main
} else {
  git clone $repoUrl $target
}

Set-Location $target
node scripts/verify-workspace.mjs

if (-not $SkipInstall) {
  npm ci
}

$workspace = Join-Path $target "ReleaseRoom.code-workspace"
if (Get-Command cursor -ErrorAction SilentlyContinue) {
  cursor $workspace
} else {
  Write-Host "Cursor CLI was not found. Open this workspace manually: $workspace"
}

Write-Host "Release Room workspace ready: $target"
