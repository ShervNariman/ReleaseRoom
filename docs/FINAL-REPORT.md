# Release Room v3 — Controlled-Pilot Completion Report

## Product outcome

Release Room is an evidence-backed go/no-go workspace for small AI-native startup teams whose code output is increasing faster than founders can confidently reconstruct customer readiness.

The product does not replace GitHub, Linear, Vercel, coding agents, AI reviewers, observability, analytics, or feature flags. It combines their evidence with human proof and deterministic policy to answer the cross-functional question those tools do not own: **is this feature genuinely ready for customers?**

The founder command center keeps the wedge visible. A release can have green CI, a healthy preview, and review approval while remaining blocked by missing mobile recovery, rollback ownership, launch communication, analytics, or founder approval. Routine success is compressed; unresolved human work is elevated.

## Implemented controlled-pilot capability

- Founder command center with ready, needs-attention, and blocked decisions
- Adaptive policies for UI, billing, authentication, permission, API, and database changes
- Intent, engineering, experience, operations, and launch evidence groups
- Release creation from validated repository, branch, commit, PR, Linear issue, preview, and changed-file context
- Release-specific GitHub checks and current human-review evidence
- Release-specific Linear acceptance-criteria evidence
- Vercel deployment evidence only for a matching release commit
- Signed GitHub, Linear, Vercel, editor, and generic evidence ingestion
- Manual evidence, approvals, blocks, and documented exceptions
- Durable SQLite/libSQL-compatible release, evidence, integration-event, and audit history
- Truthful integration states: fixture, configured, connected, stale, and degraded
- Signed, issued, expiring private sessions and session enforcement inside mutation actions
- Login throttling, production security headers, bounded payloads, provider timeouts, liveness, and database readiness
- Locked dependencies and a full clean CI release gate

## Integration correctness

Provider context is derived from each release candidate rather than global demo identifiers. Matching uses the strongest available identifiers and rejects ambiguous results. Repository-only events cannot silently bind to the newest release.

Vercel never substitutes an unrelated newest deployment. GitHub’s own Release Room readiness check is excluded from incoming CI evidence. Running checks remain pending. A token or signing secret marks a provider configured; only a verified event marks it connected.

The supported GitHub pilot path is a least-privilege token and/or signed webhook. GitHub App installation authentication and OAuth onboarding are not claimed.

## Security and data integrity

The decision engine remains deterministic. AI and external providers can contribute evidence or explanations, but they cannot silently redefine policy or become the source of truth for the final decision.

Hosted deployments fail closed unless explicit access, session, and generic evidence-webhook secrets are supplied. Session cookies are HttpOnly, signed, issued with a server-validated lifetime, and secure on hosted HTTPS. Private mutation actions enforce the session internally.

Provider webhooks verify signatures before parsing, reject stale Linear deliveries, bound raw payload size, validate normalized content, and reject normal sequential retries before evidence mutation. Distributed crash-safe exactly-once processing is not claimed for this pilot.

## Real-user experience

The integration page explains what is merely configured, what has proven itself live, what is stale, and what is degraded. It shows endpoints, access boundaries, event counts, last verified activity, and last errors.

The new-release workflow prevents identifiers that would create unreliable evidence matching. Errors are shown inline and the interface explains why repository, commit, linked records, and changed files matter.

Desktop, 390px mobile, keyboard-oriented interaction, and automated accessibility remain part of the release gate. The approved marketing source of truth is the founder command-center screenshot followed by the evidence-room screenshot. The rejected demo is not used in the primary feeler.

## Delivery and governance

The standalone public repository is `ShervNariman/ReleaseRoom`. The product remains a controlled private beta/pilot. The repository has no explicit license and must not be described as open source.

The v3 manager, integration, security, real-user, resilience, and final-review workstreams are controlled in the Release Room v3 Linear project. The release branch is merged only after the same complete clean gate passes five final executions and the manager records a go decision.

## Quality gate

The locked GitHub Actions gate covers:

1. Standalone ReleaseRoom workspace verification
2. Reproducible `npm ci` installation
3. ESLint with zero warnings
4. Strict TypeScript
5. Unit and integration contracts
6. Production build
7. Desktop, 390px mobile, and accessibility browser regression
8. Production dependency audit at the high-severity threshold

Failure diagnostics are retained as artifacts. The final five-pass record is maintained in Linear so the repository does not need another commit after the validated head.

## Approved deployment boundary

Release Room v3 is suitable for controlled use by one trusted owner or a very small trusted team with environment-managed provider credentials and manual production promotion.

It is not approved or marketed as a public multi-tenant self-serve SaaS. Broader exposure requires organization membership, RBAC, tenant isolation, OAuth installation, customer secret management, distributed abuse controls, durable queues/outbox processing, backup and restore drills, operational alerting, an external security review, and a support/SLA model.

## Final verdict

**Pilot-ready after the final five-pass clean gate and manager approval.** The core release-readiness workflow is production-oriented and truthful within that boundary; the residual work is expansion architecture rather than an undisclosed defect in the pilot wedge.
