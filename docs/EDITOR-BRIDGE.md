# Editor and coding-agent bridge

Release Room v2 does not scrape private editor sessions or prompts. It accepts **explicit, approved evidence** from Cursor, Codex, Claude Code, shell scripts, or any other coding environment through a small signed CLI.

## Configure

```bash
export RELEASE_ROOM_URL=https://your-release-room.example.com/api/evidence
export RELEASE_ROOM_WEBHOOK_SECRET='same-secret-as-the-server'
export RELEASE_ROOM_RELEASE='team-billing-settings'
```

## Cursor / Grok example

```bash
release-room start \
  --editor Cursor \
  --model 'Grok 4.5 Very Fast' \
  --task SHE-71 \
  --branch feature/live-dashboard

release-room complete \
  --editor Cursor \
  --model 'Grok 4.5 Very Fast' \
  --task SHE-71 \
  --checks lint,typecheck,test,build \
  --files 14 \
  --minutes 42 \
  --outcome 'Live dashboard implemented and validated.'
```

Use the same `--run-id` on start and completion to update one evidence card. Add the command to a Cursor project rule or run it from the integrated terminal after a scoped task.

## Codex or Claude Code

Change `--editor` and `--model`; the protocol is intentionally vendor-neutral.

## Safe preview

```bash
release-room complete --release team-billing-settings --editor Cursor --model 'Grok 4.5 Very Fast' --task SHE-71 --dry-run
```

The CLI sends bounded metadata only. It does not upload prompts, code, diffs, environment variables, or local file contents.
