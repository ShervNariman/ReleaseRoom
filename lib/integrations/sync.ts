import { getRelease, upsertEvidence, addAudit } from "@/lib/db";
import { githubEvidence } from "@/lib/integrations/github";
import { linearEvidence } from "@/lib/integrations/linear";
import { vercelEvidence } from "@/lib/integrations/vercel";

export async function syncProviders(slug: string) {
  const release = await getRelease(slug); if (!release) throw new Error("Release not found");
  const results = await Promise.allSettled([githubEvidence(release.commitSha), linearEvidence(), vercelEvidence(release.commitSha)]);
  let updated = 0; const errors: string[] = [];
  for (const result of results) {
    if (result.status === "rejected") { errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason)); continue; }
    for (const item of result.value) { await upsertEvidence(slug, item); updated++; }
  }
  await addAudit(slug, "refreshed", "Provider sync", `${updated} evidence items refreshed${errors.length ? `; ${errors.length} provider error(s)` : ""}.`);
  return { updated, errors };
}
