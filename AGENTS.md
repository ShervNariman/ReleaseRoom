# Release Room agent operating rules

## Model routing
- Use **Grok 4.5 Very Fast** for roughly 90% of implementation, tests, adapters, documentation, and routine fixes.
- Use **Sonnet 5** only for final architecture, difficult defects, security-sensitive cleanup, and high-impact interface polish.
- Codex is the independent QA and code-review lane.

## Source of truth
- Linear project: `Release Room v2 — Live Production Polish`.
- Manager issue: `SHE-68`.
- Keep issue scope narrow and record material design decisions in `docs/BUILD-JOURNAL.md`.

## Repository boundary
- This repository is the only Cursor and GitHub environment for Release Room.
- Never open Release Room branches or pull requests against EdgeLens.
- Do not modify EdgeLens from this workspace.

## Release gate
A change is complete only after lint, strict type checking, unit tests, production build, desktop E2E, mobile responsive E2E, accessibility smoke tests, and signed integration smoke tests pass.

## Safety
- Never commit credentials, provider payloads containing private code, or customer data.
- Release decisions must be deterministic. LLM output may explain or draft communication, but never decides whether a release passes.
- Webhooks must be signed, bounded, validated, and idempotent.
