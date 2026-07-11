import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processGitHubWebhook } from "@/lib/integrations/providers/github-webhook";
import { ProviderRequestError, readBoundedBody, verifyGitHubSignature } from "@/lib/integrations/providers/security";

export async function POST(request: Request) {
  if (!env.GITHUB_WEBHOOK_SECRET) return NextResponse.json({ error: "GitHub webhook is not configured" }, { status: 503 });
  try {
    const body = await readBoundedBody(request);
    if (!verifyGitHubSignature(body, request.headers.get("x-hub-signature-256"), env.GITHUB_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const delivery = request.headers.get("x-github-delivery");
    const event = request.headers.get("x-github-event");
    if (!delivery || !event) return NextResponse.json({ error: "Missing GitHub delivery headers" }, { status: 400 });
    const result = await processGitHubWebhook({ event, delivery, body: JSON.parse(body) });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ProviderRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process GitHub webhook" }, { status: 400 });
  }
}
