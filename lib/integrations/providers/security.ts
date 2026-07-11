import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_PROVIDER_PAYLOAD_BYTES = 128 * 1024;

export async function readBoundedBody(request: Request, maxBytes = MAX_PROVIDER_PAYLOAD_BYTES) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new ProviderRequestError("Payload too large", 413);
  const body = await request.text();
  if (Buffer.byteLength(body) > maxBytes) throw new ProviderRequestError("Payload too large", 413);
  return body;
}

export class ProviderRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hmacHex(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyGitHubSignature(body: string, signature: string | null, secret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  return safeEqual(signature, `sha256=${hmacHex(body, secret)}`);
}

export function verifyLinearSignature(body: string, signature: string | null, secret: string) {
  return Boolean(signature) && safeEqual(signature as string, hmacHex(body, secret));
}

export function verifyVercelSignature(signature: string | null, secret: string) {
  return Boolean(signature) && safeEqual(signature as string, secret);
}

export function isFreshTimestamp(value: unknown, windowMs = 5 * 60 * 1000) {
  const timestamp = typeof value === "number" ? value : Number(value);
  return Number.isFinite(timestamp) && Math.abs(Date.now() - timestamp) <= windowMs;
}
