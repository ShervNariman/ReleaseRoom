# Sherv OS Integration

ReleaseRoom participates in Sherv OS as the release-governance and readiness module.

- ChatGPT: executive brain and final release review.
- Cursor: supervised implementation and debugging.
- Codex: contained background tasks.
- Linear: operational truth.
- GitHub: technical truth.

## Controls
1. Read the repository and linked Linear issue before editing.
2. Treat release evidence, CI state, deployment state, and approvals as authoritative inputs.
3. Never claim readiness when a required check is absent or stale.
4. Run native lint, typecheck, tests, build, and credentialed smoke checks where available.
5. Production promotion, rollback, credential changes, destructive operations, and external publishing require human approval.
6. Record who approved, what changed, evidence used, and how to reverse the action.
7. Missing integrations fail closed and appear clearly as blockers.
