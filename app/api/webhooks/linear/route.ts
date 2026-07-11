import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processLinearWebhook } from "@/lib/integrations/providers/linear-webhook";
import { isFreshTimestamp, ProviderRequestError, readBoundedBody, verifyLinearSignature } from "@/lib/integrations/providers/security";

export async function POST(request: Request) {
  if (!env.LINEAR_WEBHOOK_SECRET) return NextResponse.json({ error: "Linear webhook is not configured" }, { status: 503 });
  try {
    const body = await readBoundedBody(request);
    if (!verifyLinearSignature(body, request.headers.get("linear-signature"), env.LINEAR_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const json = JSON.parse(body) as { webhookTimestamp?: number };
    const timestamp = json.webhookTimestamp ?? request.headers.get("linear-timestamp");
    if (!isFreshTimestamp(timestamp)) return NextResponse.json({ error: "Stale webhook" }, { status: 401 });
    const delivery = request.headers.get("linear-delivery");
    if (!delivery) return NextResponse.json({ error: "Missing Linear delivery ID" }, { status: 400 });
    const result = await processLinearWebhook({ delivery, body: json });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ProviderRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process Linear webhook" }, { status: 400 });
  }
}
