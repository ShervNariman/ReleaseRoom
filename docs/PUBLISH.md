# Standalone repository and Cursor environment

Release Room now lives in the private GitHub repository:

`ShervNariman/ReleaseRoom`

The repository includes:

- dedicated Cursor rules under `.cursor/rules/`;
- `AGENTS.md` with model routing and repository boundaries;
- GitHub Actions quality gates;
- signed GitHub, Linear, Vercel, and editor evidence integrations;
- a live founder dashboard and deterministic release policy engine.

## Local setup

```bash
git clone https://github.com/ShervNariman/ReleaseRoom.git
cd ReleaseRoom
npm install
cp .env.example .env.local
npm run db:reset
npm run dev
```

Open this folder as its own Cursor workspace. Do not reuse the EdgeLens workspace for Release Room tasks.

## Deployment checklist

1. Configure strong access, session, and webhook secrets.
2. Configure a durable libSQL/Turso database for hosted use.
3. Add GitHub, Linear, and Vercel credentials or webhook secrets.
4. Set `RELEASE_ROOM_PUBLIC_URL` to the hosted HTTPS URL.
5. Run `npm run quality:full` and `npm run smoke:integrations`.
6. Enable GitHub readiness-check publishing only after the token or GitHub App has Checks write permission.
