import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { webhookSecret } from "@/lib/env";

const boundedMetadata = z.record(z.string().max(80), z.union([z.string().max(500), z.number(), z.boolean(), z.null()])).refine((value) => Object.keys(value).length <= 30, "Too many metadata fields");

export const webhookPayloadSchema = z.object({
  eventId: z.string().min(1).max(200),
  releaseSlug: z.string().min(1).max(200),
  actor: z.string().min(1).max(100).default("Webhook"),
  eventType: z.string().min(1).max(100).default("evidence.reported"),
  metadata: boundedMetadata.optional(),
  evidence: z.object({
    key: z.string().min(1).max(120),
    category: z.enum(["intent", "engineering", "experience", "operations", "launch"]),
    label: z.string().min(1).max(150),
    description: z.string().min(1).max(1500),
    status: z.enum(["passed", "warning", "failed", "pending"]),
    required: z.boolean().default(false),
    source: z.string().min(1).max(100),
    sourceUrl: z.string().url().optional(),
    owner: z.string().max(100).optional(),
  }),
});

export function signatureFor(body: string, secret = webhookSecret) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

export function verifySignature(body: string, signature: string | null, secret = webhookSecret) {
  if (!signature) return false;
  const expected = Buffer.from(signatureFor(body, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
