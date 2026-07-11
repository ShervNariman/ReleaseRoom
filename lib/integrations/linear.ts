import { env } from "@/lib/env";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem } from "@/lib/types";

type LinearResponse = { data?: { issue?: { identifier: string; title: string; description?: string; url: string } }; errors?: Array<{ message: string }> };
export async function linearEvidence(): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.LINEAR_API_KEY || !env.LINEAR_ISSUE_ID) return [];
  const response = await fetchJson<LinearResponse>("https://api.linear.app/graphql", { method: "POST", headers: { Authorization: env.LINEAR_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ query: `query($id: String!) { issue(id: $id) { identifier title description url } }`, variables: { id: env.LINEAR_ISSUE_ID } }) });
  if (response.errors?.length) throw new Error(response.errors[0].message);
  const issue = response.data?.issue; const description = issue?.description ?? "";
  const hasCriteria = /acceptance criteria|definition of done|\- \[[ x]\]/i.test(description);
  return [{ key: "acceptance-criteria", category: "intent", label: "Acceptance criteria", description: hasCriteria ? `Acceptance criteria found on ${issue?.identifier}.` : `No explicit acceptance criteria found on ${issue?.identifier ?? "the linked issue"}.`, status: hasCriteria ? "passed" : "failed", required: true, source: "Linear", sourceUrl: issue?.url, owner: "Product", observedAt: new Date().toISOString() }];
}
