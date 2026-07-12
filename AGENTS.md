# Release Room agent operating rules

## Canonical environment
- Repository: `ShervNariman/ReleaseRoom`
- Local/Cursor workspace folder: `ReleaseRoom`
- Linear project: `Release Room v3 — Production Readiness`
- Manager issue: `SHE-93`

## Hard repository boundary
- This folder and repository are the only allowed coding environment for Release Room.
- Never create Release Room branches, commits, pull requests, generated files, screenshots, or test artifacts in EdgeLens.
- Never modify EdgeLens from this workspace.
- Before any publish action, verify `git remote get-url origin` equals `https://github.com/ShervNariman/ReleaseRoom.git`.
- Before any PR creation, verify the target repository is exactly `ShervNariman/ReleaseRoom`.
- If either check fails, stop instead of attempting a workaround.

## Model routing
- Use **Grok 4.5 Very Fast** for roughly 90% of implementation, tests, adapters, documentation, and routine fixes.
- Use **Sonnet 5** only for final architecture, difficult defects, security-sensitive cleanup, and high-impact interface polish.
- Codex is the independent QA and code-review lane.

## Release gate
A change is complete only after lint, strict type checking, unit and integration tests, production build, desktop E2E, mobile responsive E2E, accessibility smoke tests, signed provider smoke tests, dependency audit, and clean-clone CI pass.

## Product and safety rules
- Release decisions must remain deterministic. LLM output may explain or draft communication, but never decides whether a release passes.
- Webhooks must be signed, bounded, validated, freshness-checked, and idempotent.
- Never commit credentials, raw provider payloads containing private code, customer data, local databases, `.env` files, build output, or test recordings.
- Integration claims must match actual setup, happy-path, failure-path, and freshness behavior.
