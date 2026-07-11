import { env } from "@/lib/env";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem } from "@/lib/types";

type CheckRuns = { total_count: number; check_runs: Array<{ name: string; conclusion: string | null; details_url?: string }> };
type Reviews = Array<{ state: string; user?: { login?: string }; html_url?: string }>;
export async function githubEvidence(commitSha: string): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY) return [];
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10" };
  const checks = await fetchJson<CheckRuns>(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/commits/${commitSha}/check-runs`, { headers });
  const pass = checks.total_count > 0 && checks.check_runs.every((run) => ["success", "neutral", "skipped"].includes(run.conclusion ?? ""));
  const items: Array<Omit<EvidenceItem, "id" | "releaseId">> = [{ key: "ci", category: "engineering", label: "CI checks", description: checks.total_count === 0 ? "No GitHub checks were reported for this commit." : `${checks.check_runs.filter((r) => r.conclusion === "success").length}/${checks.total_count} GitHub checks passed.`, status: checks.total_count === 0 ? "pending" : pass ? "passed" : "failed", required: true, source: "GitHub", sourceUrl: checks.check_runs[0]?.details_url, owner: "CI", observedAt: new Date().toISOString() }];
  if (env.GITHUB_PR_NUMBER) {
    const reviews = await fetchJson<Reviews>(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls/${env.GITHUB_PR_NUMBER}/reviews`, { headers });
    const approval = [...reviews].reverse().find((r) => r.state === "APPROVED");
    items.push({ key: "human-review", category: "engineering", label: "Human code review", description: approval ? `Approved by ${approval.user?.login ?? "a reviewer"}.` : "No approving human review found.", status: approval ? "passed" : "pending", required: true, source: "GitHub", sourceUrl: approval?.html_url, owner: approval?.user?.login, observedAt: new Date().toISOString() });
  }
  return items;
}
