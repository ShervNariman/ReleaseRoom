# Repository leakage audit

Date: 2026-07-12

## EdgeLens

- Misrouted Release Room PR #29 was closed unmerged.
- All earlier Release Room drafts in EdgeLens remain closed and unmerged.
- EdgeLens has zero open Release Room pull requests.
- Default-branch code searches for `Release Room`, `release-room`, and `RELEASE_ROOM` returned no implementation matches.

## ReleaseRoom

- The canonical repository is `ShervNariman/ReleaseRoom`.
- Public-repository searches found no private keys, personal email addresses, EdgeLens paths, or EdgeLens implementation references.
- Local secret-pattern scanning found no committed tokens or private keys.
- `.env`, local databases, build output, test output, and raw recordings are excluded from both Git and Cursor context.
- Stale runtime work folders were removed. `/mnt/data/ReleaseRoom` is the only active Release Room source workspace.

## Known intentional references

`AGENTS.md`, `.cursor/rules/release-room.mdc`, and the migration documents mention EdgeLens only as a prohibited repository boundary and audit record. They contain no EdgeLens source code or product implementation.

## Publish guard

Run this before any release or pull request:

```bash
npm run verify:workspace
```

The command fails unless the folder and Git remote identify the standalone ReleaseRoom repository.
