# Architecture and Rationale Memorandum

## Decision

Release Room is implemented as a deterministic release-assurance layer rather than a general project-management, deployment, or AI-agent platform.

## Architecture

- **Next.js App Router** serves the private dashboard, evidence room, onboarding surfaces, API endpoints, and recording route.
- **libSQL/SQLite** stores release candidates, normalized evidence, and immutable-style audit events. A local file works without credentials; Turso or another libSQL endpoint provides durable production storage.
- **Policy engine** maps changed-file signals to required evidence. The same inputs always produce the same release policy.
- **Decision engine** evaluates required evidence and the latest human decision. LLM output never decides readiness.
- **Provider adapters** read GitHub checks/reviews, Linear issue intent, and Vercel deployment state. All requests have hard timeouts and safe fixture mode.
- **Generic evidence webhook** accepts a small validated payload protected by HMAC-SHA256. Event IDs make audit writes idempotent.
- **Private access boundary** uses an HttpOnly signed cookie after an access-key challenge. This is appropriate for a single-owner private MVP; public multi-tenant OAuth is deliberately deferred.

## Why GitHub is the integration bus

Most engineering tools already publish checks, reviews, comments, or statuses to GitHub. Treating GitHub as the default evidence bus means Release Room can consume CI, security, and AI-review results without building a deep custom OAuth integration for every vendor. Direct Linear and Vercel adapters add product intent and deployed-preview context.

## Data model

A release candidate owns:

1. identifying context: repository, branch, commit, environment, owner;
2. changed files, which select the adaptive risk policy;
3. normalized evidence grouped as intent, engineering, experience, operations, and launch;
4. audit events for creation, refresh, evidence updates, approvals, blocks, and exceptions.

Evidence is upserted by `(release_id, key)`. This lets multiple syncs safely refresh one proof without producing duplicate rows.

## Security choices

- Provider tokens stay on the server.
- Generic webhook bodies are capped at 64 KiB, parsed only after signature verification, and validated with Zod.
- HMAC comparisons use timing-safe equality.
- External requests abort after eight seconds.
- Empty GitHub check sets remain pending instead of being misclassified as passing.
- Missing Linear acceptance criteria fail the intent gate.
- Human exceptions require a named actor and rationale and do not erase unresolved blockers.

## Deferred public-MVP requirements

A public beta should add OAuth installations, organization isolation, encrypted credential storage, database backups, rate limiting, job queues, hosted browser capture, outbound check-run writes, billing, and formal observability. These are intentionally outside the private MVP so the core release decision can be validated first.
