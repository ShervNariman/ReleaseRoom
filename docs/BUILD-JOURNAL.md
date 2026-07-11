# Build Journal

## July 10–11, 2026 — Product definition

Release Room was narrowed from a broad release-management dashboard to an evidence-backed go/no-go system. The key positioning is: **green code is not the same as a ready feature**. The initial customer is a technical founder or founding engineer at a 2–15 person AI-native startup.

## Dashboard principle

The interface was organized around five questions a founder needs answered in ten seconds: what is shipping, whether it is ready, what blocks it, who must act, and what happens after deployment. Passing routine checks remain compact; missing proof receives visual priority.

## Integration principle

GitHub became the default evidence bus because CI, review, security, and many AI-code-review tools already publish there. Linear supplies intent and acceptance criteria. Vercel supplies actual preview evidence. A signed generic webhook prevents the integration roadmap from becoming a product blocker.

## QA findings and fixes

- Automated accessibility analysis found insufficient contrast in evidence denominators. Text contrast was raised rather than waiving the issue.
- Empty GitHub check sets were identified as a false-positive risk and now stay pending.
- Missing Linear acceptance criteria now fail the intent gate instead of producing a weak warning.
- Provider requests now have hard timeouts.
- The managed system Chromium blocked every URL by policy. QA did not weaken that system policy; an isolated Chromium runtime supplied by the project was used instead.
- Full iPhone emulation was unstable in the isolated headless runtime. The mobile lane was changed to the exact 390×844 responsive viewport with touch enabled, which validates the product layout without depending on unrelated browser-emulation behavior.

## Operating model

Cursor/Grok 4.5 Very Fast is the primary implementation lane. Sonnet 5 is reserved for final architecture and high-impact polish. Codex is assigned independent QA and code review in Linear. The repository itself encodes the same handoff rules in `AGENTS.md` and Cursor rules.
