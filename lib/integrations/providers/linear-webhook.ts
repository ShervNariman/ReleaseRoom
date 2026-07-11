import { z } from "zod";
import { addAudit, findReleaseForEvent, recordIntegrationEvent, upsertEvidence } from "@/lib/db";
import { publishGitHubDecisionForSlug } from "@/lib/integrations/github-checks";

const schema = z.object({
  action: z.string(), type: z.string(), webhookTimestamp: z.number().optional(), createdAt: z.string().optional(), url: z.string().url().optional(), actor: z.object({ name: z.string().optional() }).optional(),
  data: z.object({ identifier: z.string().optional(), description: z.string().optional().nullable(), issue: z.object({ identifier: z.string().optional() }).optional() }).passthrough(),
}).passthrough();

export async function processLinearWebhook(input: { delivery: string; body: unknown }) {
  const payload = schema.parse(input.body);
  const identifier = payload.data.identifier ?? payload.data.issue?.identifier ?? null;
  const release = await findReleaseForEvent({ linearIdentifier: identifier });
  const actor = payload.actor?.name ?? "Linear";
  let summary = `${payload.type} ${payload.action}`;
  if (release && payload.type.toLowerCase() === "issue") {
    const description = payload.data.description ?? "";
    const hasCriteria = /acceptance criteria|definition of done|\- \[[ x]\]/i.test(description);
    summary = `${identifier ?? "Linear issue"} ${payload.action}; acceptance criteria ${hasCriteria ? "present" : "missing"}`;
    await upsertEvidence(release.slug, { key: "acceptance-criteria", category: "intent", label: "Acceptance criteria", description: hasCriteria ? `Acceptance criteria found on ${identifier}.` : `No explicit acceptance criteria found on ${identifier ?? "the linked issue"}.`, status: hasCriteria ? "passed" : "failed", required: true, source: "Linear webhook", sourceUrl: payload.url ?? release.linearUrl, owner: "Product" });
    await addAudit(release.slug, "evidence_added", actor, summary, `linear-audit-${input.delivery}`);
  } else if (release) {
    summary = `${payload.type} ${payload.action} matched ${release.title}`;
    await addAudit(release.slug, "refreshed", actor, summary, `linear-audit-${input.delivery}`);
  } else summary = `${payload.type} ${payload.action} did not match an active release`;
  const result = await recordIntegrationEvent({ provider: "linear", eventId: `linear:${input.delivery}`, releaseSlug: release?.slug, eventType: `${payload.type}.${payload.action}`, status: release ? "processed" : "ignored", summary, actor, occurredAt: payload.createdAt, sourceUrl: payload.url, metadata: { identifier } });
  if (release) { try { await publishGitHubDecisionForSlug(release.slug); } catch { /* Optional outbound status must not reject signed inbound events. */ } }
  return { ...result, matched: Boolean(release), releaseSlug: release?.slug ?? null };
}
