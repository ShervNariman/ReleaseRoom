import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processVercelWebhook } from "@/lib/integrations/providers/vercel-webhook";
import { ProviderRequestError, readBoundedBody, verifyVercelSignature } from "@/lib/integrations/providers/security";

export async function POST(request: Request) {
  if (!env.VERCEL_WEBHOOK_SECRET) return NextResponse.json({ error: "Vercel webhook is not configured" }, { status: 503 });
  try {
    const body = await readBoundedBody(request);
    if (!verifyVercelSignature(request.headers.get("x-vercel-signature"), env.VERCEL_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const result = await processVercelWebhook(JSON.parse(body));
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ProviderRequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process Vercel webhook" }, { status: 400 });
  }
}
