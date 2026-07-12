import { listIntegrationStates } from "@/lib/db";
import { env } from "@/lib/env";
import type { IntegrationHealth, IntegrationProvider } from "@/lib/types";

const names: Record<IntegrationProvider, string> = {
  github: "GitHub",
  linear: "Linear",
  vercel: "Vercel",
  editor: "Editor & agent bridge",
  webhook: "Generic evidence webhook",
};

const permissions: Record<IntegrationProvider, string[]> = {
  github: [
    "Read checks and reviews for the repository linked to each release",
    "Receive signed repository webhooks",
    "Optional: publish Release Room checks through a GitHub App",
  ],
  linear: [
    "Read the issue linked to each release",
    "Receive signed issue webhooks",
  ],
  vercel: [
    "Read deployments for the configured project",
    "Receive deployment lifecycle webhooks",
  ],
  editor: [
    "Submit approved task and run evidence",
    "Never reads editor prompts or local files automatically",
  ],
  webhook: ["Create or update evidence on a named release"],
};

function configured(provider: IntegrationProvider) {
  if (provider === "github") {
    return Boolean(
      env.GITHUB_TOKEN ||
        env.GITHUB_WEBHOOK_SECRET ||
        (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY),
    );
  }
  if (provider === "linear") {
    return Boolean(env.LINEAR_API_KEY || env.LINEAR_WEBHOOK_SECRET);
  }
  if (provider === "vercel") {
    return Boolean(
      (env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID) ||
        env.VERCEL_WEBHOOK_SECRET,
    );
  }
  return Boolean(env.RELEASE_ROOM_WEBHOOK_SECRET);
}

function endpointFor(provider: IntegrationProvider) {
  const path =
    provider === "editor" || provider === "webhook"
      ? "/api/evidence"
      : `/api/webhooks/${provider}`;
  return env.RELEASE_ROOM_PUBLIC_URL
    ? `${env.RELEASE_ROOM_PUBLIC_URL}${path}`
    : path;
}

export async function integrationHealth(): Promise<IntegrationHealth[]> {
  const states = await listIntegrationStates();
  const stateMap = new Map(states.map((state) => [state.provider, state]));
  const currentTime = Date.now();

  return (
    ["github", "linear", "vercel", "editor", "webhook"] as IntegrationProvider[]
  ).map((provider) => {
    const state = stateMap.get(provider);
    const last = state?.lastSync ? new Date(state.lastSync).getTime() : 0;
    const stale = last > 0 && currentTime - last > 24 * 60 * 60 * 1000;
    const status: IntegrationHealth["status"] =
      state?.status === "degraded"
        ? "degraded"
        : stale
          ? "stale"
          : state
            ? "connected"
            : configured(provider)
              ? "configured"
              : "fixture";
    const detail =
      state?.detail ??
      (configured(provider)
        ? provider === "editor"
          ? "The signed CLI bridge is configured and waiting for its first verified report."
          : "Credentials or webhook secrets are configured. A verified live event is still required before this integration is marked connected."
        : "Fixture and manual-read mode. Add provider credentials or a webhook secret to activate live evidence.");

    return {
      provider,
      name: names[provider],
      status,
      detail,
      lastSync: state?.lastSync ?? null,
      lastSuccess: state?.lastSuccess ?? null,
      lastError: state?.lastError ?? null,
      eventCount: state?.eventCount ?? 0,
      endpoint: endpointFor(provider),
      permissions: permissions[provider],
    };
  });
}
