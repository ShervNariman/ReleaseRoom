import { env } from "@/lib/env";
import { listIntegrationStates } from "@/lib/db";
import type { IntegrationHealth, IntegrationProvider } from "@/lib/types";

const names: Record<IntegrationProvider, string> = {
  github: "GitHub",
  linear: "Linear",
  vercel: "Vercel",
  editor: "Editor & agent bridge",
  webhook: "Generic evidence webhook",
};

const permissions: Record<IntegrationProvider, string[]> = {
  github: ["Read pull requests, checks, and reviews", "Receive signed repository webhooks", "Optional: publish Release Room checks through a GitHub App"],
  linear: ["Read linked issues", "Receive signed issue webhooks"],
  vercel: ["Read deployments", "Receive deployment lifecycle webhooks"],
  editor: ["Submit approved task and run evidence", "Never reads editor prompts or local files automatically"],
  webhook: ["Create or update evidence on a named release"],
};

function configured(provider: IntegrationProvider) {
  if (provider === "github") return Boolean((env.GITHUB_TOKEN && env.GITHUB_REPOSITORY) || env.GITHUB_WEBHOOK_SECRET);
  if (provider === "linear") return Boolean((env.LINEAR_API_KEY && env.LINEAR_ISSUE_ID) || env.LINEAR_WEBHOOK_SECRET);
  if (provider === "vercel") return Boolean((env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID) || env.VERCEL_WEBHOOK_SECRET);
  return true;
}

export async function integrationHealth(): Promise<IntegrationHealth[]> {
  const states = await listIntegrationStates();
  const stateMap = new Map(states.map((state) => [state.provider, state]));
  const now = Date.now();
  return (["github", "linear", "vercel", "editor", "webhook"] as IntegrationProvider[]).map((provider) => {
    const state = stateMap.get(provider);
    const last = state?.lastSync ? new Date(state.lastSync).getTime() : 0;
    const stale = last > 0 && now - last > 24 * 60 * 60 * 1000;
    const status: IntegrationHealth["status"] = state?.status === "degraded" ? "degraded" : stale ? "stale" : state ? "connected" : configured(provider) ? "connected" : "fixture";
    const endpoint = env.RELEASE_ROOM_PUBLIC_URL
      ? provider === "editor" || provider === "webhook"
        ? `${env.RELEASE_ROOM_PUBLIC_URL}/api/evidence`
        : `${env.RELEASE_ROOM_PUBLIC_URL}/api/webhooks/${provider}`
      : provider === "editor" || provider === "webhook"
        ? "/api/evidence"
        : `/api/webhooks/${provider}`;
    const detail = state?.detail ?? (configured(provider)
      ? provider === "editor" ? "The signed CLI bridge is ready for Cursor and other coding agents." : "Configured and waiting for the first live event."
      : "Fixture and manual-read mode. Add the provider secret or credentials to activate live events.");
    return { provider, name: names[provider], status, detail, lastSync: state?.lastSync ?? null, eventCount: state?.eventCount ?? 0, endpoint, permissions: permissions[provider] };
  });
}
