# Release Room Private MVP — Completion Report

## Page 1 — Product and delivery

Release Room is a production-oriented private MVP for small AI-native startup teams whose engineering output is increasing faster than their founders can confidently review it. The product does not compete with GitHub, Linear, Vercel, AI code reviewers, feature-flag platforms, or observability tools. It sits above them as the cross-functional release decision layer.

The MVP demonstrates the wedge through a seeded billing release. GitHub-style checks, human review, a healthy preview, and a successful Stripe test all appear green. Release Room still blocks the candidate because the mobile recovery state is broken, failed-payment recovery has not been demonstrated, the support note is unacknowledged, and founder approval is missing. This makes the product value visible immediately: technical completion is necessary, but not sufficient for customer readiness.

The founder dashboard is intentionally minimalist. A decision hero states READY, NEEDS ATTENTION, or BLOCKED. Five evidence groups—Intent, Engineering, Experience, Operations, and Launch—show proof coverage. The action queue hides routine success and surfaces only human work. A release path shows progress from intent through observation. Risk policies are selected automatically from changed files, so a content edit remains lightweight while billing, authentication, permissions, public APIs, and database migrations require stronger proof.

The product includes an evidence room for each release, manual proof capture, provider refresh, approvals, blocks, exceptions with mandatory rationale, and a durable audit timeline. A new-release workflow lets a founder create a candidate from repository context and changed files. The integration screen communicates live versus fixture mode and the exact permissions each connection requires.

GitHub, Linear, and Vercel adapters are server-only and bounded by hard timeouts. GitHub contributes CI and human-review evidence; an empty check set cannot pass. Linear contributes product intent; missing acceptance criteria fails. Vercel contributes the deployed preview. A generic HMAC-signed webhook lets GitHub Actions, n8n, Make, EdgeLens, SlopCheck, or internal tools submit normalized evidence without a bespoke integration.

## Page 2 — Quality, security, marketing, and next steps

The private access model uses a long access key and HttpOnly signed session cookie. Provider credentials never reach the browser. The webhook body is capped at 64 KiB, verified before parsing, validated with Zod, and written idempotently. The decision engine is deterministic: AI can later explain findings or draft launch communication, but it cannot silently approve a release. Human exceptions preserve the unresolved blockers and the rationale in the audit record.

The repository includes strict TypeScript, ESLint, Vitest unit coverage, a production build, Playwright desktop and exact mobile-responsive flows, and axe-core accessibility smoke testing. The QA lane tests the founder dashboard, evidence room, recording route, and serious/critical accessibility findings. CI repeats lint, type checking, tests, and the build on every pull request and push to main.

Marketing is a first-class deliverable. The `/record/release-room` route presents the wedge in a clean, self-contained frame. Automated scripts capture the product story, login, founder dashboard, and evidence room. A second script turns deterministic scene captures into a WebM demo using the system FFmpeg. The repository also contains a shot list, launch-thread draft, architecture memorandum, build journal, and reproducible instructions, so future public updates can show both progress and proof.

The private MVP is deliberately single-owner and fixture-friendly. It is ready to dogfood against real provider credentials and validate whether the release-decision workflow saves founder review time or prevents avoidable mistakes. A public MVP should next add GitHub App and Linear/Vercel OAuth installations, workspace isolation, encrypted credential storage, durable hosted database backups, queues for provider sync and screenshot capture, rate limiting, outbound GitHub/Vercel gate writes, Slack approvals, Sentry observation windows, PostHog adoption confirmation, and public-safe release receipts.

The recommended validation target is five to ten small teams that deploy several times per week and still rely on a founder or senior engineer to reconstruct release readiness manually. The product earns its purchase when it does either of two things: returns several hours of senior review time each month, or prevents one customer-facing release the team would have regretted.


## Final verification snapshot

The release candidate completed the final gate with zero lint warnings, strict TypeScript passing, 12 unit tests passing, five desktop browser tests passing, four mobile browser tests passing with one desktop-only mutation flow skipped by design, no critical or serious accessibility findings, a clean production build, and zero reported production dependency vulnerabilities. Marketing capture produced four screenshots and a ten-second WebM product demo.
