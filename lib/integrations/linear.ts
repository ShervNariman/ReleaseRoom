import { env } from "@/lib/env";
import { releaseIntegrationContext } from "@/lib/integrations/context";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem, ReleaseCandidate } from "@/lib/types";

type LinearResponse = {
  data?: {
    issue?: {
      identifier: string;
      title: string;
      description?: string;
      url: string;
    };
  };
  errors?: Array<{ message: string }>;
};

export async function linearEvidence(
  release: ReleaseCandidate,
): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.LINEAR_API_KEY) return [];

  const issueId = releaseIntegrationContext(release).linearIssueId;
  if (!issueId) return [];

  const response = await fetchJson<LinearResponse>(
    "https://api.linear.app/graphql",
    {
      method: "POST",
      headers: {
        Authorization: env.LINEAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query:
          "query($id: String!) { issue(id: $id) { identifier title description url } }",
        variables: { id: issueId },
      }),
    },
  );
  if (response.errors?.length) throw new Error(response.errors[0].message);

  const issue = response.data?.issue;
  if (!issue) {
    return [
      {
        key: "acceptance-criteria",
        category: "intent",
        label: "Acceptance criteria",
        description: `The linked Linear issue ${issueId} could not be found.`,
        status: "pending",
        required: true,
        source: "Linear",
        sourceUrl: release.linearUrl,
        owner: "Product",
        observedAt: new Date().toISOString(),
      },
    ];
  }

  const description = issue.description ?? "";
  const hasCriteria =
    /acceptance criteria|definition of done|\- \[[ x]\]/i.test(description);
  return [
    {
      key: "acceptance-criteria",
      category: "intent",
      label: "Acceptance criteria",
      description: hasCriteria
        ? `Acceptance criteria found on ${issue.identifier}.`
        : `No explicit acceptance criteria found on ${issue.identifier}.`,
      status: hasCriteria ? "passed" : "failed",
      required: true,
      source: "Linear",
      sourceUrl: issue.url,
      owner: "Product",
      observedAt: new Date().toISOString(),
    },
  ];
}
