# Release Room workspace migration

## Canonical locations

- GitHub: `https://github.com/ShervNariman/ReleaseRoom`
- Cursor folder: `ReleaseRoom`
- Linear: `Release Room v3 — Production Readiness`

## Migration status

Release Room development is isolated from EdgeLens. The active workspace is named `ReleaseRoom`, and all future branches and pull requests must target `ShervNariman/ReleaseRoom`.

The misrouted EdgeLens draft PR #29 was closed unmerged. Code search found no Release Room implementation on the EdgeLens default branch, and there are no open Release Room PRs in EdgeLens.

## Guardrails

- `AGENTS.md` and `.cursor/rules/release-room.mdc` require repository verification before any publish action.
- `.cursorignore` prevents build output, databases, credentials, and raw recordings from entering agent context.
- `ReleaseRoom.code-workspace` is the dedicated Cursor workspace entry point.
- Local databases, build output, test results, and environment files remain ignored by Git.

## Verification commands

```bash
test "$(basename "$PWD")" = "ReleaseRoom"
test "$(git remote get-url origin)" = "https://github.com/ShervNariman/ReleaseRoom.git"
git status --short --branch
npm run quality
npm run e2e
npm run smoke:integrations
```

Any failed repository or folder assertion is a hard stop.
