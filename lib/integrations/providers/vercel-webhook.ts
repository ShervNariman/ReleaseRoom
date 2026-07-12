import { z } from "zod";
import {
  addAudit,
  findReleaseForEvent,
  hasIntegrationEvent,
  recordIntegrationEvent,
  upsertEvidence,
} from "@/lib/db";
import { publishGitHubDecisionForSlug } from "@/lib/integrations/github-checks";

const schema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.union([z.string(), z.number()]).optional(),
  payload: z
    .object({
      deployment: z
        .object({
          id: z.string().optional(),
          url: z.string().optional(),
          meta: z.record(z.string(), z.unknown()).optional(),
        })
        .optional(),
      links: z.object({ deployment: z.string().optional() }).optional(),
    })
    .passthrough(),
});

function deploymentStatus(type: string) {
  if (
    ["deployment.ready", "deployment.succeeded", "deployment.promoted"].includes(
      type,
    )
  ) {
    return "passed" as const;
  }
  if (
    ["deployment.error", "deployment.canceled", "deployment.rollback"].includes(
      type,
    )
  ) {
    return "failed" as const;
  }
  return "pending" as const;
}

function text(value: unknown) {
  return typeof value === "string" ? value : null;
}

function repositoryFromMeta(meta: Record<string, unknown>) {
  const owner =
    text(meta.githubCommitOrg) ??
    text(meta.githubOrg) ??
    text(meta.gitOrg) ??
    text(meta.gitCommitOrg);
  const repository =
    text(meta.githubCommitRepo) ??
    text(meta.githubRepo) ??
    text(meta.gitRepo) ??
    text(meta.gitCommitRepo);
  return owner && repository ? `${owner}/${repository}` : null;
}

function occurredAt(value: string | number | undefined) {
  if (typeof value === "string") return value;
  if (typeof value !== "number") return undefined;
  const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
  return new Date(milliseconds).toISOString();
}

export async function processVercelWebhook(body: unknown) {
  const event = schema.parse(body);
  const eventId = `vercel:${event.id}`;
  if (await hasIntegrationEvent(eventId)) {
    return { duplicate: true, matched: false, releaseSlug: null };
  }

  const deployment = event.payload.deployment;
  const meta = deployment?.meta ?? {};
  const commitSha = text(meta.githubCommitSha) ?? text(meta.gitCommitSha);
  const repository = repositoryFromMeta(meta);
  const rawUrl = deployment?.url ?? null;
  const previewUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `https://${rawUrl}`
    : null;
  const release = await findReleaseForEvent({
    commitSha,
    repository,
    previewUrl,
  });
  const status = deploymentStatus(event.type);
  const summary = release
    ? `${event.type.replace("deployment.", "Deployment ")} for ${release.title}`
    : `${event.type} did not match an active release`;
  const sourceUrl = event.payload.links?.deployment ?? previewUrl;

  if (release) {
    const production = event.type === "deployment.promoted";
    await upsertEvidence(release.slug, {
      key: production ? "production-deployment" : "preview",
      category: "operations",
      label: production ? "Production deployment" : "Preview deployment",
      description: summary,
      status,
      required: true,
      source: "Vercel webhook",
      sourceUrl,
      owner: "Platform",
    });
    await addAudit(
      release.slug,
      "evidence_added",
      "Vercel",
      summary,
      `vercel-audit-${event.id}`,
    );
  }

  const result = await recordIntegrationEvent({
    provider: "vercel",
    eventId,
    releaseSlug: release?.slug,
    eventType: event.type,
    status: release ? "processed" : "ignored",
    summary,
    actor: "Vercel",
    occurredAt: occurredAt(event.createdAt),
    sourceUrl,
    metadata: {
      commitSha,
      repository,
      deploymentId: deployment?.id,
    },
  });

  if (release) {
    try {
      await publishGitHubDecisionForSlug(release.slug);
    } catch {
      // Optional outbound status must not reject signed inbound events.
    }
  }

  return {
    ...result,
    matched: Boolean(release),
    releaseSlug: release?.slug ?? null,
  };
}
