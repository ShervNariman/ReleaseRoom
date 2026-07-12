"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { addAudit, upsertEvidence } from "@/lib/db";
import { publishGitHubDecisionForSlug } from "@/lib/integrations/github-checks";
import { syncProviders } from "@/lib/integrations/sync";

const result = (message: string) => ({ message });
const slugSchema = z.string().trim().min(1).max(180);

export async function refreshReleaseAction(
  _: { message: string },
  formData: FormData,
) {
  await requireSession();
  const parsedSlug = slugSchema.safeParse(formData.get("slug"));
  if (!parsedSlug.success) return result("Invalid release.");

  try {
    const sync = await syncProviders(parsedSlug.data);
    revalidatePath(`/releases/${parsedSlug.data}`);
    revalidatePath("/");
    return result(
      `${sync.updated} items refreshed${
        sync.errors.length
          ? `; ${sync.errors.length} provider warning(s)`
          : ""
      }.`,
    );
  } catch (error) {
    return result(error instanceof Error ? error.message : "Refresh failed");
  }
}

const evidenceSchema = z.object({
  slug: slugSchema,
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-_]*$/i, "Use a simple evidence key."),
  category: z.enum([
    "intent",
    "engineering",
    "experience",
    "operations",
    "launch",
  ]),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().min(4).max(1_000),
  status: z.enum(["passed", "warning", "failed", "pending"]),
  owner: z.string().trim().max(80).optional(),
  required: z.string().optional(),
});

export async function addEvidenceAction(
  _: { message: string },
  formData: FormData,
) {
  await requireSession();
  const parsed = evidenceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return result(parsed.error.issues[0]?.message ?? "Invalid evidence");
  }

  await upsertEvidence(parsed.data.slug, {
    key: parsed.data.key,
    category: parsed.data.category,
    label: parsed.data.label,
    description: parsed.data.description,
    status: parsed.data.status,
    required: parsed.data.required === "on",
    source: "Manual",
    owner: parsed.data.owner || null,
  });
  await addAudit(
    parsed.data.slug,
    "evidence_added",
    parsed.data.owner || "Manual reviewer",
    `${parsed.data.label} marked ${parsed.data.status}.`,
  );
  revalidatePath(`/releases/${parsed.data.slug}`);
  revalidatePath("/");
  return result("Evidence saved.");
}

const decisionSchema = z.object({
  slug: slugSchema,
  actor: z.string().trim().min(2).max(80),
  note: z.string().trim().min(12).max(1_000),
  decision: z.enum(["approved", "override", "blocked"]),
});

export async function decideReleaseAction(
  _: { message: string },
  formData: FormData,
) {
  await requireSession();
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return result(parsed.error.issues[0]?.message ?? "Invalid decision");
  }

  await addAudit(
    parsed.data.slug,
    parsed.data.decision,
    parsed.data.actor,
    parsed.data.note,
  );
  let publishWarning = "";
  try {
    const published = await publishGitHubDecisionForSlug(parsed.data.slug);
    if (!published.published && published.reason === "not-configured") {
      publishWarning = " GitHub check was not configured.";
    }
  } catch (error) {
    publishWarning = ` GitHub check warning: ${
      error instanceof Error ? error.message : "publish failed"
    }.`;
  }
  revalidatePath(`/releases/${parsed.data.slug}`);
  revalidatePath("/");
  return result(`Decision recorded.${publishWarning}`);
}
