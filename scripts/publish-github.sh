#!/usr/bin/env bash
set -euo pipefail

TARGET_REPO="${1:-ShervNariman/ReleaseRoom}"
DESCRIPTION="Evidence-backed release readiness for small AI-native startup teams."

command -v gh >/dev/null 2>&1 || { echo "GitHub CLI (gh) is required." >&2; exit 1; }
gh auth status >/dev/null

if ! gh repo view "$TARGET_REPO" >/dev/null 2>&1; then
  gh repo create "$TARGET_REPO" --private --description "$DESCRIPTION"
fi

REMOTE_URL="https://github.com/${TARGET_REPO}.git"
if git remote get-url origin >/dev/null 2>&1; then git remote set-url origin "$REMOTE_URL"; else git remote add origin "$REMOTE_URL"; fi

git push -u origin main
git push origin agent/v2-live-production-polish
git push origin --tags

echo "Published Release Room to https://github.com/${TARGET_REPO}"
