import { addAudit, getRelease, upsertEvidence } from "@/lib/db";
import { githubEvidence } from "@/lib/integrations/github";
import { linearEvidence } from "@/lib/integrations/linear";
import { vercelEvidence } from "@/lib/integrations/vercel";

export async function syncProviders(slug: string) {
  const release = await getRelease(slug);
  if (!release) throw new Error("Release not found");

  const providers = [
    { name: "GitHub", task: githubEvidence(release) },
    { name: "Linear", task: linearEvidence(release) },
    { name: "Vercel", task: vercelEvidence(release) },
  ] as const;
  const results = await Promise.allSettled(
    providers.map((provider) => provider.task),
  );

  let updated = 0;
  const errors: string[] = [];
  for (const [index, result] of results.entries()) {
    const provider = providers[index];
    if (result.status === "rejected") {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      errors.push(`${provider.name}: ${reason}`);
      continue;
    }

    for (const item of result.value) {
      await upsertEvidence(slug, item);
      updated += 1;
    }
  }

  await addAudit(
    slug,
    "refreshed",
    "Provider sync",
    `${updated} evidence items refreshed${errors.length ? `; ${errors.length} provider error(s): ${errors.join(" | ")}` : ""}.`,
  );
  return { updated, errors };
}
