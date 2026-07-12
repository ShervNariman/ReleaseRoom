# Release Room v3 production readiness

Date: 2026-07-12
Scope: controlled single-owner or very small trusted-team private beta/pilot
Repository: `ShervNariman/ReleaseRoom`
Manager: Linear `SHE-93`

## Executive decision

Release Room is production-oriented for controlled pilot use. It must not be described as multi-tenant, public-GA, open source, or fully self-serve until the residual boundaries below are deliberately resolved.

The release decision engine remains deterministic. Provider and AI output may contribute evidence or explanation, but cannot independently decide whether a release passes.

## Loop 1 — integration architecture

### Corrected

- Provider backfill derives repository, PR, Linear issue, commit, and preview context from each release.
- Vercel refresh never falls back to the newest unrelated deployment.
- GitHub refresh excludes Release Room's own outbound readiness check from CI evidence.
- Running or inconclusive GitHub checks remain pending instead of becoming false failures.
- Event-to-release matching uses deterministic precedence and requires a unique match.
- Repository-only webhook events do not attach evidence to the latest release.
- Sequential duplicate provider deliveries are rejected before evidence mutation.
- Integration status distinguishes configured credentials from a verified connected provider.
- The supported GitHub pilot path is a least-privilege token and/or signed webhook. Unimplemented GitHub App credentials are not advertised.

### Validation coverage

- Signed GitHub, Linear, and Vercel verification contracts
- Duplicate-delivery regression
- Unmatched and ambiguous event behavior
- Slow, unavailable, malformed, pending, and failed provider behavior
- Release-specific context parsing and cross-repository PR rejection

## Loop 2 — security and data integrity

### Corrected

- Session cookies contain a signed issue time and enforce a server-validated 14-day lifetime.
- Private mutation server actions enforce the session internally.
- Access-key attempts receive bounded per-instance throttling.
- Production response headers include CSP, HSTS, frame denial, MIME sniffing prevention, referrer policy, and a restricted permissions policy.
- Liveness and database readiness are separate endpoints.
- Integration event list limits are bounded.
- Hosted mode requires explicit access, session, and generic evidence-webhook secrets.
- Provider payloads are bounded and signatures are checked before normalized processing.

### Residual boundary

Login throttling is process-local. A horizontally scaled deployment should move abuse controls to an edge/WAF or shared durable store before public exposure. Sequential replay protection is covered; distributed crash-safe exactly-once processing is not claimed.

## Loop 3 — real-user workflow and accessibility

### Corrected

- The integration screen explains fixture, configured, connected, stale, and degraded states.
- A token or secret alone no longer creates a false green state.
- The page exposes verified activity, event count, endpoint, access boundary, and last error.
- Activation guidance tells users to link each release to its own provider records.
- Release creation validates repository, PR ownership, Linear issue, commit SHA, branch, preview, and repository-relative changed-file paths.
- Validation errors are announced inline and each integration identifier is explained.
- Marketing and repository copy distinguish a public repository from a private product beta.

### Validation coverage

- Founder creates and understands a release without builder guidance.
- Desktop and 390px mobile workflows.
- Keyboard-oriented interaction and automated accessibility checks.
- Empty, validation, provider-error, stale, unauthorized, and first-event states.

## Loop 4 — performance, resilience, and dependencies

### Corrected

- Provider refresh uses `Promise.allSettled` and records provider-specific errors without discarding successful evidence.
- Database indexes cover common repository, commit, and recent-event access paths.
- Readiness detects failed database initialization.
- Integration event reads are bounded.
- Provider reads and GitHub check publishing use hard timeouts.
- `package-lock.json` is committed and CI uses reproducible `npm ci` installs with read-only repository permission.
- The full gate includes a production dependency audit and retained failure diagnostics.

### Capacity boundary

Current queries and inline event processing are appropriate for a controlled pilot. Larger multi-tenant volume requires pagination throughout the product, durable queues/outbox processing, backpressure, shared rate controls, and operational alerting.

## Loop 5 — independent QA and release review

The final gate runs in a clean GitHub Actions environment:

- standalone workspace verification
- locked dependency installation
- ESLint with zero warnings
- strict TypeScript
- unit and integration contracts
- production build
- desktop browser workflow
- 390px mobile workflow
- accessibility regression
- production dependency audit
- independent changed-file review

No merge is allowed while critical/high findings remain, any final gate execution is red, or the manager has not recorded the go decision. The final validated head is executed through the complete gate five times.

## Current supported pilot boundary

- One trusted owner or a very small trusted team
- One deployment with environment-managed provider credentials
- Release-specific GitHub, Linear, and Vercel evidence
- Signed provider and generic evidence ingestion
- Deterministic policy and exception audit trail
- Manual production promotion outside Release Room

## Not yet supported as a public SaaS claim

- Multi-tenant data isolation
- Organization membership and role-based access control
- GitHub App or provider OAuth installation lifecycle
- Durable distributed rate limiting
- Per-tenant encryption and secret vaulting
- Durable queue/outbox ingestion and exactly-once guarantees
- Billing, subscriptions, support tooling, or a public SLA
- Automatic Vercel production promotion or enforcement
- Formal compliance certification or penetration-test attestation

## Marketing truth

The GitHub repository is public, but there is no explicit license. Do not describe the project as open source. The product may be described as a private beta or controlled pilot only.

The approved feeler media is the founder command-center screenshot followed by the evidence-room screenshot. The prior 15-second demo is superseded for the initial post.
