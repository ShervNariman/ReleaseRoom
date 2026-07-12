# Independent QA Report — v3 production hardening

## Scope

The QA lane validates the controlled-pilot release across deterministic policy behavior, provider matching, signed ingestion, authentication, release creation, evidence mutation, decision history, production build, responsive workflows, accessibility, and dependency health.

## Required automated gate

Every final stability pass runs the same clean GitHub Actions job:

| Gate | Required result |
|---|---|
| Standalone workspace verification | Pass |
| Locked `npm ci` install | Pass |
| ESLint | Pass with zero warnings |
| Strict TypeScript | Pass |
| Unit and integration contracts | Pass |
| Production build | Pass |
| Desktop browser workflows | Pass |
| 390px mobile workflows | Pass, with only explicitly desktop-only capture/mutation cases skipped |
| Automated accessibility | No critical or serious axe-core findings |
| Production dependency audit | Pass at high severity threshold |

The manager records the five final full-gate executions in Linear. A red execution invalidates the release gate until corrected and repeated.

## Adversarial and correctness coverage

- Billing, authentication, permission, database, API, and UI file paths select adaptive release requirements.
- Missing required evidence blocks a release deterministically.
- Explicit blocks and documented exceptions remain visible in the audit trail.
- GitHub checks in progress remain pending rather than being mislabeled failed.
- Release Room’s own outbound GitHub check cannot satisfy its incoming CI evidence.
- GitHub repository, PR, and commit context is derived from each release candidate.
- Linear reads the issue linked to the candidate rather than a global demo issue.
- Vercel evidence is accepted only for a matching commit; the newest unrelated deployment is never used as a fallback.
- Sequential duplicate provider deliveries are rejected before evidence mutation.
- Modified signatures and stale Linear webhook timestamps are rejected.
- Provider payloads are bounded and outbound reads time out.
- Release input rejects cross-repository PRs, invalid commit SHAs, non-issue Linear links, traversal paths, and excessive file lists.
- Unauthenticated server actions redirect to login before creating releases, refreshing providers, changing evidence, or recording decisions.
- Hosted mode fails closed without explicit access, session, and evidence-webhook secrets.
- Liveness and database readiness are independently observable.

## Real-user workflow coverage

- A founder can sign in, understand the active blocker, pause/resume/refresh the live command center, and open the evidence room.
- A release can be created from repository-specific identifiers and changed files.
- Manual evidence can be added and reflected in the decision.
- Integration onboarding distinguishes fixture, configured, connected, stale, and degraded states.
- The integration page exposes endpoints, access boundaries, event counts, freshness, and last errors.
- Desktop and mobile layouts preserve the core decision and action queue.
- The public-repository/private-beta boundary remains consistent in product and marketing surfaces.

## Defects discovered and resolved during hardening

1. Duplicate provider deliveries could update evidence before idempotency was checked.
2. Broad event matching could attach evidence to the wrong release candidate.
3. Vercel backfill could select an unrelated newest deployment.
4. GitHub and Linear backfill reused global demo identifiers across releases.
5. Release Room’s own GitHub readiness check could become circular CI evidence.
6. Configured credentials were displayed as a live connected integration before any verified event.
7. Static session cookies were replayable indefinitely.
8. Mutation server actions relied on page-layout authentication instead of enforcing the session themselves.
9. New release inputs accepted identifiers that could never drive a reliable integration match.
10. GitHub App credentials were advertised as configured although App installation authentication was not implemented.
11. CI installs were not reproducible because the repository lacked a lockfile.
12. Browser tests hard-coded the local demo key instead of using deployed configuration.
13. Running GitHub checks were treated as failures rather than pending evidence.
14. Marketing copy still described the public repository as closed-source.

## Residual pilot boundaries

- Authentication is designed for one trusted owner or a very small trusted team, not organizations and RBAC.
- Provider secrets are environment-managed rather than installed through tenant OAuth.
- Login throttling is process-local and should move to shared edge/durable enforcement before horizontal public deployment.
- Sequential replay protection is covered; crash-safe distributed exactly-once ingestion is not claimed.
- Production deployment remains manual and outside Release Room.
- No public SLA, formal penetration-test attestation, or compliance certification is claimed.

## QA verdict

**Eligible for a controlled single-owner or very small trusted-team pilot after the final five-pass clean gate and manager approval.** It is not approved as a public multi-tenant self-serve SaaS.
