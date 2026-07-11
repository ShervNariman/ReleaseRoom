# Release Room

**The evidence-backed go/no-go system for small AI-native startup teams.**

AI helps small teams produce more code. Release Room helps them decide what is complete and safe enough to reach customers.

A pull request can be green in GitHub, deployed on Vercel, linked in Linear, and approved by an AI reviewer—while still missing mobile validation, a rollback owner, analytics, customer communication, or the failure path promised in the original requirement. Release Room assembles that evidence into one calm decision.

## What the private MVP includes

- A founder command center that explains a blocker in under ten seconds
- Adaptive release policies based on changed files
- Evidence groups for intent, engineering, experience, operations, and launch
- GitHub, Linear, and Vercel adapters with safe fixture mode
- Signed, bounded, idempotent generic evidence webhook
- Manual proof capture and durable decision history
- Approve, block, and approve-with-exception flows
- Private access-key authentication
- Local SQLite/libSQL persistence and Turso-compatible production configuration
- Desktop, mobile-responsive, and accessibility browser QA
- Recording route, automated screenshots, video workflow, build journal, and architecture memorandum

## Start locally

```bash
npm install
cp .env.example .env.local
npm run db:reset
npm run dev
```

Open `http://localhost:3000/login`. The local-only demo key is `release-room-private`. Set `RELEASE_ROOM_ACCESS_KEY` before any deployed use.

## Quality gate

```bash
npm run quality
npm run e2e
```

## Connect providers

The application is immediately useful in fixture mode. Add environment values from `.env.example` to activate live reads:

- GitHub: repository checks and human reviews
- Linear: linked issue and explicit acceptance criteria
- Vercel: matching preview deployment

Run `npm run sync:providers -- team-billing-settings` or use **Refresh providers** in the release room.

## Generic evidence webhook

POST to `/api/evidence` with the raw JSON body signed as:

```text
x-release-room-signature: sha256=<HMAC-SHA256(body, RELEASE_ROOM_WEBHOOK_SECRET)>
```

This permits GitHub Actions, n8n, Make, EdgeLens, SlopCheck, or any internal checker to contribute evidence without a bespoke integration.

## Marketing capture

Start the production server on port 3100, then:

```bash
npm run marketing:capture
npm run marketing:record
```

Artifacts are written under `marketing/screenshots` and `marketing/video/raw`.

## Product boundary

Release Room does not replace GitHub, Linear, Vercel, CodeRabbit, Sentry, PostHog, or LaunchDarkly. It uses their evidence to answer the cross-functional question they do not own: **is this feature genuinely ready for customers?**
