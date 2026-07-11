# Independent QA Report — Private MVP

## Scope

The QA lane validated the deterministic release policy, decision output, webhook integrity, private authentication flow, persistent release workflow, responsive product interface, recording route, and production build.

## Automated results

| Gate | Result |
|---|---:|
| ESLint | Pass, zero warnings |
| Strict TypeScript | Pass |
| Unit tests | 12 passed |
| Production build | Pass |
| Desktop browser flows | 5 passed |
| Mobile responsive flows | 4 passed, 1 desktop-only mutation test skipped by design |
| Accessibility smoke | No critical or serious axe-core violations |
| Production dependency audit | 0 vulnerabilities |

## Adversarial cases covered

- Missing policy evidence is synthesized and blocks the release.
- Billing files trigger critical-risk requirements.
- A human exception preserves unresolved blockers and rationale.
- Explicit human block wins over otherwise passing evidence.
- Modified webhook bodies fail timing-safe HMAC verification.
- Duplicate webhook event IDs return a successful duplicate response without mutating evidence again.
- Empty GitHub check sets remain pending.
- Missing Linear acceptance criteria fail the intent gate.
- Provider requests abort after a hard timeout.
- A new billing release can be created, policy-selected, and enriched with manual evidence through the real browser.

## Defects discovered and resolved

1. Evidence denominators did not meet the desired contrast threshold. Contrast was increased.
2. Policy-synthesized evidence affected the decision count but was not visible in group totals or the evidence room. The UI now uses the same effective evidence set as the decision engine.
3. Secure cookies were enabled for every production-mode localhost test, preventing the private session from persisting over HTTP. Secure cookies now activate for hosted HTTPS deployments or an explicit secure-cookie flag.
4. Duplicate webhook events updated evidence timestamps despite audit idempotency. Duplicate event IDs are now rejected before any evidence mutation.
5. The isolated Chromium version initially required a newer Node patch version and could close during tests. A Node-compatible isolated Chromium release is pinned.

## QA verdict

**Approved for private single-owner dogfooding.** No unresolved critical or high defects remain. Public multi-tenant use requires the controls listed in the architecture memorandum.
