import { env } from "@/lib/env";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem } from "@/lib/types";

type Deployments = { deployments: Array<{ uid: string; url: string; state: string; meta?: Record<string, string> }> };
export async function vercelEvidence(commitSha: string): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.VERCEL_TOKEN || !env.VERCEL_PROJECT_ID) return [];
  const team = env.VERCEL_TEAM_ID ? `&teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}` : "";
  const data = await fetchJson<Deployments>(`https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(env.VERCEL_PROJECT_ID)}&limit=20${team}`, { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` } });
  const deployment = data.deployments.find((d) => d.meta?.githubCommitSha === commitSha) ?? data.deployments[0];
  return [{ key: "preview", category: "operations", label: "Preview deployment", description: deployment ? `Vercel deployment is ${deployment.state.toLowerCase()}.` : "No matching Vercel deployment found.", status: deployment?.state === "READY" ? "passed" : deployment ? "failed" : "pending", required: true, source: "Vercel", sourceUrl: deployment ? `https://${deployment.url}` : undefined, owner: "Platform", observedAt: new Date().toISOString() }];
}
