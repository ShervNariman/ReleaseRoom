import { z } from "zod";

const schema = z.object({
  RELEASE_ROOM_ACCESS_KEY: z.string().min(12).optional(),
  RELEASE_ROOM_SESSION_SECRET: z.string().min(16).optional(),
  RELEASE_ROOM_WEBHOOK_SECRET: z.string().min(16).optional(),
  RELEASE_ROOM_PUBLIC_URL: z.string().url().optional(),
  RELEASE_ROOM_LIVE_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(5_000)
    .max(120_000)
    .default(15_000),
  DATABASE_URL: z.string().default("file:release-room.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(16).optional(),
  GITHUB_CHECKS_ENABLED: z.enum(["true", "false"]).default("false"),
  LINEAR_API_KEY: z.string().optional(),
  LINEAR_WEBHOOK_SECRET: z.string().min(16).optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  VERCEL_WEBHOOK_SECRET: z.string().min(16).optional(),
});

export const env = schema.parse(process.env);
export const accessKey =
  env.RELEASE_ROOM_ACCESS_KEY ?? "release-room-private";
export const sessionSecret =
  env.RELEASE_ROOM_SESSION_SECRET ?? "local-session-secret-only";
export const webhookSecret =
  env.RELEASE_ROOM_WEBHOOK_SECRET ?? "local-webhook-secret-only";

const hosted =
  Boolean(process.env.VERCEL) ||
  process.env.RELEASE_ROOM_ENFORCE_STRONG_SECRETS === "true";
if (
  hosted &&
  (!env.RELEASE_ROOM_ACCESS_KEY ||
    !env.RELEASE_ROOM_SESSION_SECRET ||
    !env.RELEASE_ROOM_WEBHOOK_SECRET)
) {
  throw new Error(
    "Hosted Release Room requires explicit access, session, and webhook secrets.",
  );
}
