# Release Room

**The evidence-backed go/no-go system for small AI-native startup teams.**

AI helps small teams produce more code. Release Room helps them decide what is complete and safe enough to reach customers.

A pull request can be green in GitHub, deployed on Vercel, linked in Linear, and approved by an AI reviewer—while still missing mobile validation, a rollback owner, analytics, customer communication, or the failure path promised in the original requirement. Release Room assembles that evidence into one calm, deterministic decision.

## Current release stage

Release Room is being hardened for a small, founder-led **private beta/pilot**. The GitHub repository is public for transparent product development, but the repository currently has no explicit software license. Public visibility does not grant permission to copy, redistribute, or describe the project as open source.

The current product is appropriate for controlled single-owner pilots. It is not yet positioned as a public, multi-tenant, self-serve SaaS.

## What the pilot includes

- A founder command center that explains blockers quickly
- Adaptive release policies based on changed files
- Evidence groups for intent, engineering, experience, operations, and launch
- Release-specific GitHub, Linear, and Vercel backfill
- Signed, bounded provider webhooks with replay checks and deterministic release matching
- A provider-neutral editor and coding-agent evidence bridge
- Manual proof capture and durable decision history
- Approve, block, and documented-exception workflows
- Signed, expiring access-key sessions with basic login throttling
- Local SQLite/libSQL persistence and Turso-compatible hosted configuration
- Truthful integration states: fixture, configured, connected, stale, or degraded
- Desktop, 390px mobile, accessibility, unit, contract, build, and dependency QA
- Separate liveness and database-readiness endpoints

## Start locally

```bash
npm install
cp .env.example .env.local
npm run db:reset
npm run dev
```

Open `http://localhost:3000/login`. The local-only demo key is `release-room-private`. Set explicit access, session, and webhook secrets before any hosted use.

## Quality gate

```bash
npm run quality:full
```

The full gate verifies the standalone ReleaseRoom workspace, lint, strict TypeScript, unit and contract tests, production build, desktop/mobile/accessibility browser flows, and the production dependency audit.

## Connect providers

The application is immediately useful in fixture mode. Add environment values from `.env.example` to activate live reads and signed events.

Each real release should include its own:

- GitHub repository, commit SHA, and pull-request URL
- Linear issue URL
- Vercel preview URL where available

Release Room derives provider context from the release itself. It does not reuse one global issue or pull-request number across unrelated release candidates.

Provider roles:

- **GitHub:** checks and current human approvals for the linked commit and PR
- **Linear:** acceptance criteria from the linked issue
- **Vercel:** deployment evidence only when the deployment commit matches the release

Run `npm run sync:providers -- <release-slug>` or use **Refresh providers** in an evidence room.

## Generic evidence webhook

POST to `/api/evidence` with the raw JSON body signed as:

```text
x-release-room-signature: sha256=<HMAC-SHA256(body, RELEASE_ROOM_WEBHOOK_SECRET)>
```

This allows GitHub Actions, n8n, Make, EdgeLens, SlopCheck, or an internal checker to contribute named evidence without a bespoke adapter. The sender must provide an idempotency key and a valid release slug.

## Operations

- `GET /api/health` is a process liveness check.
- `GET /api/ready` checks database initialization and connectivity.
- Integration status does not become `connected` merely because a token or secret exists. A verified live event is required.
- Security headers are applied globally in production.

## Approved marketing capture

The approved launch-feeler media is the two-screen screenshot pair:

1. Founder command center
2. Evidence room

The earlier 15-second demo is superseded for the initial X feeler. Marketing governance and copy live in the X Marketing Linear project.

## Product boundary

Release Room does not replace GitHub, Linear, Vercel, CodeRabbit, Sentry, PostHog, or LaunchDarkly. It uses their evidence to answer the cross-functional question they do not own: **is this feature genuinely ready for customers?**

Current residual boundaries are documented in `docs/PRODUCTION-READINESS.md`. The most important are single-owner authentication, environment-managed provider credentials, no tenant isolation, and no automatic production-deployment enforcement.
