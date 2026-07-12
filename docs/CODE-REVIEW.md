# Independent Code Review — Release Room v3

## Review scope

The production-hardening diff was reviewed for deterministic decisions, release identity, provider correctness, replay behavior, authentication, server-action authorization, policy integrity, persistence, failure isolation, truthful capability boundaries, accessibility, CI reproducibility, dependency health, and operational readiness.

## High-risk findings resolved

### 1. Evidence could attach to the wrong release

The original event lookup used broad OR conditions across repository, commit, PR, issue, and preview fields. Repository-only events could select the newest candidate. Matching now uses ordered, release-specific identifiers and requires a unique result. Ambiguous or unmatched events remain unmatched.

### 2. Provider refresh reused global demo identifiers

GitHub repository/PR, Linear issue, Vercel commit, and preview context now come from each release candidate. New-release validation rejects identifiers that cannot support reliable matching.

### 3. Vercel could produce a false pass

The adapter no longer falls back to the newest deployment. It returns pending evidence when no deployment commit matches the release.

### 4. Duplicate deliveries mutated evidence before the duplicate check

Provider handlers now reject already-recorded delivery IDs before changing evidence or audit history. This covers normal sequential retries. Distributed crash-safe exactly-once processing is intentionally not claimed.

### 5. Outbound GitHub readiness could become circular evidence

The GitHub adapter excludes the `Release Room / Product readiness` check from incoming CI evidence.

### 6. Integration health showed false green states

Credentials and secrets produce `configured`, not `connected`. A verified event is required for `connected`; stale and degraded states remain visible.

### 7. Session authorization was incomplete

Static session values were replaced by issued, signed, expiring tokens. Private mutation server actions now enforce the session internally rather than relying only on layout redirects. Invalid access-key attempts are throttled per process.

### 8. Evidence could weaken a resolved policy

An observed item using a policy key could overwrite the policy-owned `required`, category, or label fields. Effective evidence now takes those fields from the deterministic resolved policy while retaining the observed status, description, source, owner, and timestamp. Policy relaxation requires a visible documented exception rather than a silent evidence edit.

### 9. Hosted security and operations lacked explicit boundaries

Hosted mode requires explicit access, session, and webhook secrets. Production security headers are global. Liveness and database readiness are separate. Integration event reads are bounded.

### 10. Dependency installation was non-deterministic

A generated lockfile is committed. CI uses `npm ci` with read-only repository permissions and retains diagnostics on failure.

### 11. Capability claims exceeded implementation

GitHub App configuration was removed because installation authentication is not implemented. The supported pilot path uses a least-privilege GitHub token and/or signed webhook. The repository is public, the product is a private beta, and no open-source claim is made without a license.

## Design qualities retained

- Policy selection and release decisions remain deterministic.
- Policy-owned requirements cannot be downgraded by observed evidence.
- AI and provider systems contribute evidence or explanation; they do not become the source of truth for the final decision.
- Provider adapters execute server-side with bounded payloads and timeouts.
- Partial provider refresh failures do not discard successful evidence.
- Manual evidence, blocks, approvals, and exceptions remain auditable.
- The editor bridge submits explicit approved evidence without scraping prompts or local files.
- Product, integration, and marketing surfaces disclose freshness and capability boundaries.

## Residual controlled-pilot risks

- Single-owner/shared-key authentication rather than organizations, memberships, and RBAC.
- Environment-managed provider credentials rather than tenant OAuth and a secret vault.
- Inline event processing rather than a durable queue/outbox architecture.
- Process-local login throttling rather than distributed abuse controls.
- Application-enforced audit history rather than cryptographically append-only storage.
- Manual production promotion; Release Room does not block or execute Vercel production deployment.
- No formal external penetration test, SLA, backup drill, or compliance attestation.

## Reviewer verdict

**No unresolved critical or high code-review finding remains for the controlled pilot boundary.** Merge is permitted only after the final five-pass full CI gate and the manager’s recorded go decision.
