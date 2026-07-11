import { z } from "zod";
import { addAudit, findReleaseForEvent, recordIntegrationEvent, upsertEvidence } from "@/lib/db";
import { publishGitHubDecisionForSlug } from "@/lib/integrations/github-checks";

const schema = z.object({
  id: z.string(), type: z.string(), createdAt: z.union([z.string(), z.number()]).optional(),
  payload: z.object({
    deployment: z.object({ id: z.string().optional(), url: z.string().optional(), meta: z.record(z.string(), z.unknown()).optional() }).optional(),
    links: z.object({ deployment: z.string().optional() }).optional(),
  }).passthrough(),
});

function deploymentStatus(type: string) {
  if (["deployment.ready", "deployment.succeeded", "deployment.promoted"].includes(type)) return "passed" as const;
  if (["deployment.error", "deployment.canceled", "deployment.rollback"].includes(type)) return "failed" as const;
  return "pending" as const;
}
function text(value: unknown) { return typeof value === "string" ? value : null; }

export async function processVercelWebhook(body: unknown) {
  const event = schema.parse(body);
  const deployment = event.payload.deployment;
  const meta = deployment?.meta ?? {};
  const commitSha = text(meta.githubCommitSha) ?? text(meta.gitCommitSha);
  const rawUrl = deployment?.url ?? null;
  const previewUrl = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`) : null;
  const release = await findReleaseForEvent({ commitSha, previewUrl });
  const status = deploymentStatus(event.type);
  const summary = release ? `${event.type.replace("deployment.", "Deployment ")} for ${release.title}` : `${event.type} did not match an active release`;
  const sourceUrl = event.payload.links?.deployment ?? previewUrl;
  if (release) {
    await upsertEvidence(release.slug, { key: event.type === "deployment.promoted" ? "production-deployment" : "preview", category: "operations", label: event.type === "deployment.promoted" ? "Production deployment" : "Preview deployment", description: summary, status, required: true, source: "Vercel webhook", sourceUrl, owner: "Platform" });
    await addAudit(release.slug, "evidence_added", "Vercel", summary, `vercel-audit-${event.id}`);
  }
  const result = await recordIntegrationEvent({ provider: "vercel", eventId: `vercel:${event.id}`, releaseSlug: release?.slug, eventType: event.type, status: release ? "processed" : "ignored", summary, actor: "Vercel", occurredAt: typeof event.createdAt === "number" ? new Date(event.createdAt).toISOString() : event.createdAt, sourceUrl, metadata: { commitSha, deploymentId: deployment?.id } });
  if (release) { try { await publishGitHubDecisionForSlug(release.slug); } catch { /* Optional outbound status must not reject signed inbound events. */ } }
  return { ...result, matched: Boolean(release), releaseSlug: release?.slug ?? null };
}
