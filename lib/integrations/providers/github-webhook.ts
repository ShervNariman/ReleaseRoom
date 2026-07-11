import { z } from "zod";
import { addAudit, findReleaseForEvent, recordIntegrationEvent, upsertEvidence } from "@/lib/db";
import { publishGitHubDecisionForSlug, RELEASE_ROOM_CHECK_NAME } from "@/lib/integrations/github-checks";

const optionalUrl = z.string().url().optional().nullable();
const baseSchema = z.object({
  repository: z.object({ full_name: z.string() }).optional(),
  sender: z.object({ login: z.string().optional() }).optional(),
  action: z.string().optional(),
  after: z.string().optional(),
  check_run: z.object({ head_sha: z.string().optional(), name: z.string().optional(), conclusion: z.string().optional().nullable(), status: z.string().optional(), html_url: optionalUrl, details_url: optionalUrl }).optional(),
  check_suite: z.object({ head_sha: z.string().optional(), conclusion: z.string().optional().nullable(), status: z.string().optional(), html_url: optionalUrl }).optional(),
  pull_request: z.object({ html_url: optionalUrl, head: z.object({ sha: z.string().optional() }).optional() }).optional(),
  review: z.object({ state: z.string().optional(), html_url: optionalUrl, user: z.object({ login: z.string().optional() }).optional() }).optional(),
}).passthrough();

function statusForConclusion(conclusion?: string | null) {
  if (!conclusion) return "pending" as const;
  if (["success", "neutral", "skipped"].includes(conclusion)) return "passed" as const;
  if (["failure", "cancelled", "timed_out", "action_required", "startup_failure"].includes(conclusion)) return "failed" as const;
  return "warning" as const;
}

export async function processGitHubWebhook(input: { event: string; delivery: string; body: unknown }) {
  const payload = baseSchema.parse(input.body);
  const repository = payload.repository?.full_name ?? null;
  const sender = payload.sender?.login ?? "GitHub";
  const commitSha = payload.check_run?.head_sha ?? payload.check_suite?.head_sha ?? payload.pull_request?.head?.sha ?? payload.after ?? null;
  const prUrl = payload.pull_request?.html_url ?? null;
  const release = await findReleaseForEvent({ commitSha, repository, prUrl });
  let summary = `${input.event} received`;
  let sourceUrl: string | null = prUrl;

  if (release && input.event === "check_run" && payload.check_run?.name === RELEASE_ROOM_CHECK_NAME) {
    summary = `${RELEASE_ROOM_CHECK_NAME} observed`;
    sourceUrl = payload.check_run.html_url ?? payload.check_run.details_url ?? prUrl;
  } else if (release && (input.event === "check_run" || input.event === "check_suite")) {
    const check = payload.check_run ?? payload.check_suite;
    const conclusion = check?.conclusion ?? null;
    const status = statusForConclusion(conclusion);
    summary = `${("name" in (check ?? {}) ? payload.check_run?.name : undefined) ?? "GitHub checks"} ${conclusion ?? check?.status ?? "updated"}`;
    sourceUrl = check?.html_url ?? (payload.check_run?.details_url ?? null) ?? prUrl;
    await upsertEvidence(release.slug, { key: "ci", category: "engineering", label: "CI checks", description: summary, status, required: true, source: "GitHub webhook", sourceUrl, owner: "CI" });
    await addAudit(release.slug, "evidence_added", sender, summary, `github-audit-${input.delivery}`);
  } else if (release && input.event === "pull_request_review") {
    const review = payload.review;
    const state = String(review?.state ?? "").toLowerCase();
    const status = state === "approved" ? "passed" : state === "changes_requested" ? "failed" : "pending";
    summary = `Code review ${state || "updated"} by ${review?.user?.login ?? sender}`;
    sourceUrl = review?.html_url ?? prUrl;
    await upsertEvidence(release.slug, { key: "human-review", category: "engineering", label: "Human code review", description: summary, status, required: true, source: "GitHub webhook", sourceUrl, owner: review?.user?.login ?? sender });
    await addAudit(release.slug, "evidence_added", sender, summary, `github-audit-${input.delivery}`);
  } else if (release) {
    const action = payload.action ? ` ${payload.action}` : "";
    summary = `${input.event}${action} matched ${release.title}`;
    await addAudit(release.slug, "refreshed", sender, summary, `github-audit-${input.delivery}`);
  } else summary = `${input.event} did not match an active release`;

  const result = await recordIntegrationEvent({ provider: "github", eventId: `github:${input.delivery}`, releaseSlug: release?.slug, eventType: input.event, status: release ? "processed" : "ignored", summary, actor: sender, sourceUrl, metadata: { repository, commitSha } });
  if (release && !(input.event === "check_run" && payload.check_run?.name === RELEASE_ROOM_CHECK_NAME)) { try { await publishGitHubDecisionForSlug(release.slug); } catch { /* Optional outbound status must not reject signed inbound events. */ } }
  return { ...result, matched: Boolean(release), releaseSlug: release?.slug ?? null };
}
