# Release Room v3 production readiness

Date: 2026-07-12
Scope: controlled single-owner private beta/pilot
Repository: `ShervNariman/ReleaseRoom`
Manager: Linear `SHE-93`

## Executive decision

Release Room is being hardened for controlled pilot use. It must not be described as multi-tenant, public-GA, or fully self-serve until the residual boundaries below are deliberately resolved.

The release decision engine remains deterministic. Provider and AI output may contribute evidence or explanation, but cannot independently decide whether a release passes.

## Loop 1 — integration architecture

### Corrected

- Provider backfill now derives repository, PR, Linear issue, commit, and preview context from each release.
- Vercel refresh no longer falls back to the newest unrelated deployment.
- GitHub refresh excludes Release Room's own outbound readiness check from CI evidence.
- Event-to-release matching now uses deterministic precedence and requires a unique match.
- Repository-only webhook events do not attach evidence to the latest release.
- Sequential duplicate provider deliveries are rejected before evidence mutation.
- Integration status distinguishes configured credentials from a verified connected provider.

### Required validation

- Signed GitHub, Linear, and Vercel happy paths
- Duplicate-delivery regression
- Unmatched and ambiguous event behavior
- Slow, unavailable, and malformed provider behavior

## Loop 2 — security and data integrity

### Corrected

- Session cookies now contain a signed issue time and enforce a server-validated 14-day lifetime.
- Access-key attempts receive bounded per-instance throttling.
- Production response headers include CSP, HSTS, frame denial, MIME sniffing prevention, referrer policy, and a restricted permissions policy.
- Liveness and database readiness are separate endpoints.
- Integration event list limits are bounded.
- Hosted mode still requires explicit access, session, and webhook secrets.

### Residual boundary

Login throttling is process-local. A horizontally scaled deployment should move abuse controls to an edge/WAF or shared durable store before public exposure.

## Loop 3 — real-user workflow and accessibility

### Corrected

- The integration screen explains fixture, configured, connected, stale, and degraded states.
- A token or secret alone no longer creates a false green state.
- The page exposes the first/last verified event, event count, endpoint, access boundary, and last error.
- Activation guidance tells users to link each release to its own provider records.
- Marketing and repository copy distinguish a public repository from a private product beta.

### Required validation

- Founder can create and understand a release without builder guidance.
- Desktop and 390px mobile workflows pass.
- Keyboard and automated accessibility checks pass.
- Empty, validation, provider-error, stale, and unauthorized states remain understandable.

## Loop 4 — performance, resilience, and dependencies

### Corrected

- Provider refresh uses `Promise.allSettled` and records provider-specific errors without discarding successful evidence.
- Database indexes cover common repository, commit, and recent-event access paths.
- Readiness detects failed database initialization.
- The full gate includes a production dependency audit.

### Reproducibility requirement

The original repository did not contain `package-lock.json`. The first v3 CI run generates and exports a lockfile. That lockfile must be committed, CI must move to `npm ci`, and the export-only step must be removed before final approval.

## Loop 5 — independent QA and release review

The final gate must pass in a clean GitHub Actions environment:

- standalone workspace verification
- ESLint with zero warnings
- strict TypeScript
- unit and integration contracts
- production build
- desktop browser workflow
- 390px mobile workflow
- accessibility regression
- production dependency audit
- independent changed-file review

No merge is allowed while critical/high findings remain or the CI gate is red.

## Current supported pilot boundary

- One trusted owner or very small trusted team
- One deployment with environment-managed provider credentials
- Release-specific GitHub, Linear, and Vercel evidence
- Signed provider and generic evidence ingestion
- Deterministic policy and exception audit trail
- Manual production promotion outside Release Room

## Not yet supported as a public SaaS claim

- Multi-tenant data isolation
- Organization membership and role-based access control
- OAuth installation and customer-managed integration lifecycle
- Durable distributed rate limiting
- Per-tenant encryption and secret vaulting
- Billing, subscriptions, support tooling, or a public SLA
- Automatic Vercel production promotion or enforcement
- Formal compliance certification or penetration-test attestation

## Marketing truth

The GitHub repository is public, but there is no explicit license. Do not describe the project as open source. The product may be described as a private beta or controlled pilot only.

The approved feeler media is the founder command-center screenshot followed by the evidence-room screenshot. The prior 15-second demo is superseded for the initial post.
