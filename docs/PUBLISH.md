# Standalone repository, Cursor workspace, and deployment

Release Room lives in the public GitHub repository:

`ShervNariman/ReleaseRoom`

The product itself remains a controlled private beta/pilot. The repository currently has no explicit software license, so public visibility must not be described as open-source licensing.

The repository includes:

- dedicated Cursor rules under `.cursor/rules/`;
- `AGENTS.md` with model routing and hard repository boundaries;
- GitHub Actions production-readiness gates;
- signed GitHub, Linear, Vercel, generic-webhook, and editor evidence paths;
- a founder command center and deterministic release-policy engine;
- separate liveness and database-readiness endpoints;
- a five-loop production-readiness record.

## Local setup

```bash
git clone https://github.com/ShervNariman/ReleaseRoom.git
cd ReleaseRoom
npm ci
cp .env.example .env.local
npm run db:reset
npm run dev
```

Open `ReleaseRoom.code-workspace` as its own Cursor workspace. Do not reuse the EdgeLens workspace for Release Room tasks.

## Controlled pilot deployment checklist

1. Configure strong, unique access, session, and evidence-webhook secrets.
2. Configure a durable libSQL/Turso database for hosted use.
3. Add the minimum GitHub, Linear, and Vercel credentials or signing secrets required for the pilot.
4. Set `RELEASE_ROOM_PUBLIC_URL` to the hosted HTTPS URL.
5. Link every release to its own repository, commit, PR, Linear issue, and preview where available.
6. Verify `GET /api/health` and `GET /api/ready` independently.
7. Run `npm run quality:full` and the signed integration smoke harness.
8. Confirm each provider moves from configured to connected only after a verified event.
9. Enable outbound GitHub readiness checks only after the configured token has Checks write permission.
10. Keep production promotion manual; Release Room currently provides evidence and a decision, not deployment enforcement.

## Before broader customer exposure

Do not expand beyond a controlled pilot until tenant isolation, organization membership, RBAC, OAuth installation, shared durable abuse controls, customer secret management, operational alerting, backup/restore, and an external security review are deliberately implemented.
