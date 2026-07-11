import { NextResponse } from "next/server";
import { addAudit, hasAuditEvent, recordIntegrationEvent, upsertEvidence } from "@/lib/db";
import { verifySignature, webhookPayloadSchema } from "@/lib/webhook";
import { publishGitHubDecisionForSlug } from "@/lib/integrations/github-checks";

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 65_536) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const body = await request.text();
  if (Buffer.byteLength(body) > 65_536) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifySignature(body, request.headers.get("x-release-room-signature"))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let json: unknown;
  try { json = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = webhookPayloadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  try {
    if (await hasAuditEvent(parsed.data.eventId)) return NextResponse.json({ ok: true, duplicate: true });
    await upsertEvidence(parsed.data.releaseSlug, parsed.data.evidence);
    await addAudit(parsed.data.releaseSlug, "evidence_added", parsed.data.actor, `${parsed.data.evidence.label} updated through the ${parsed.data.evidence.source}.`, parsed.data.eventId);
    const provider = parsed.data.eventType.startsWith("editor.") ? "editor" : "webhook";
    await recordIntegrationEvent({ provider, eventId: `${provider}:${parsed.data.eventId}`, releaseSlug: parsed.data.releaseSlug, eventType: parsed.data.eventType, status: "processed", summary: parsed.data.evidence.description, actor: parsed.data.actor, sourceUrl: parsed.data.evidence.sourceUrl, metadata: parsed.data.metadata });
    try { await publishGitHubDecisionForSlug(parsed.data.releaseSlug); } catch { /* Evidence ingestion must not fail when optional outbound publishing is unavailable. */ }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save evidence" }, { status: 404 });
  }
}
