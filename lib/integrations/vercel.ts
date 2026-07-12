import { env } from "@/lib/env";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem, ReleaseCandidate } from "@/lib/types";

export type VercelDeployment = {
  uid: string;
  url: string;
  state: string;
  meta?: Record<string, string>;
};

type Deployments = { deployments: VercelDeployment[] };

function shasMatch(left: string | undefined, right: string) {
  if (!left) return false;
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  if (a.length < 7 || b.length < 7) return a === b;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

export function selectDeploymentForCommit(
  deployments: VercelDeployment[],
  commitSha: string,
) {
  return deployments.find((deployment) =>
    shasMatch(
      deployment.meta?.githubCommitSha ?? deployment.meta?.gitCommitSha,
      commitSha,
    ),
  );
}

function evidenceStatus(state: string | undefined) {
  const normalized = state?.toUpperCase();
  if (normalized === "READY") return "passed" as const;
  if (["ERROR", "CANCELED", "CANCELLED"].includes(normalized ?? "")) {
    return "failed" as const;
  }
  return "pending" as const;
}

export async function vercelEvidence(
  release: ReleaseCandidate,
): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.VERCEL_TOKEN || !env.VERCEL_PROJECT_ID) return [];

  const team = env.VERCEL_TEAM_ID
    ? `&teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`
    : "";
  const data = await fetchJson<Deployments>(
    `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(env.VERCEL_PROJECT_ID)}&limit=20${team}`,
    { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` } },
  );
  const deployment = selectDeploymentForCommit(
    data.deployments,
    release.commitSha,
  );

  return [
    {
      key: "preview",
      category: "operations",
      label: "Preview deployment",
      description: deployment
        ? `Vercel deployment is ${deployment.state.toLowerCase()}.`
        : `No Vercel deployment matched commit ${release.commitSha}.`,
      status: evidenceStatus(deployment?.state),
      required: true,
      source: "Vercel",
      sourceUrl: deployment ? `https://${deployment.url}` : release.previewUrl,
      owner: "Platform",
      observedAt: new Date().toISOString(),
    },
  ];
}
