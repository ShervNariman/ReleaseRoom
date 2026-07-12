import { env } from "@/lib/env";
import { RELEASE_ROOM_CHECK_NAME } from "@/lib/integrations/github-checks";
import { releaseIntegrationContext } from "@/lib/integrations/context";
import { fetchJson } from "@/lib/integrations/http";
import type { EvidenceItem, ReleaseCandidate } from "@/lib/types";

type CheckRuns = {
  total_count: number;
  check_runs: Array<{
    name: string;
    conclusion: string | null;
    details_url?: string;
    html_url?: string;
  }>;
};

type Reviews = Array<{
  state: string;
  user?: { login?: string };
  html_url?: string;
  submitted_at?: string;
}>;

function repositoryPath(repository: string) {
  return repository
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function latestApproval(reviews: Reviews) {
  const latestByReviewer = new Map<string, Reviews[number]>();
  for (const review of reviews) {
    const reviewer = review.user?.login;
    if (reviewer) latestByReviewer.set(reviewer, review);
  }
  return [...latestByReviewer.values()].find(
    (review) => review.state.toUpperCase() === "APPROVED",
  );
}

export async function githubEvidence(
  release: ReleaseCandidate,
): Promise<Array<Omit<EvidenceItem, "id" | "releaseId">>> {
  if (!env.GITHUB_TOKEN) return [];

  const context = releaseIntegrationContext(release);
  if (!context.repository) return [];

  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  };
  const repository = repositoryPath(context.repository);
  const checks = await fetchJson<CheckRuns>(
    `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(context.commitSha)}/check-runs`,
    { headers },
  );
  const relevantChecks = checks.check_runs.filter(
    (run) => run.name !== RELEASE_ROOM_CHECK_NAME,
  );
  const passed =
    relevantChecks.length > 0 &&
    relevantChecks.every((run) =>
      ["success", "neutral", "skipped"].includes(run.conclusion ?? ""),
    );
  const successfulCount = relevantChecks.filter((run) =>
    ["success", "neutral", "skipped"].includes(run.conclusion ?? ""),
  ).length;
  const items: Array<Omit<EvidenceItem, "id" | "releaseId">> = [
    {
      key: "ci",
      category: "engineering",
      label: "CI checks",
      description:
        relevantChecks.length === 0
          ? "No external GitHub checks were reported for this commit."
          : `${successfulCount}/${relevantChecks.length} GitHub checks passed.`,
      status:
        relevantChecks.length === 0 ? "pending" : passed ? "passed" : "failed",
      required: true,
      source: "GitHub",
      sourceUrl:
        relevantChecks[0]?.details_url ?? relevantChecks[0]?.html_url,
      owner: "CI",
      observedAt: new Date().toISOString(),
    },
  ];

  if (context.pullRequestNumber) {
    const reviews = await fetchJson<Reviews>(
      `https://api.github.com/repos/${repository}/pulls/${context.pullRequestNumber}/reviews`,
      { headers },
    );
    const approval = latestApproval(reviews);
    items.push({
      key: "human-review",
      category: "engineering",
      label: "Human code review",
      description: approval
        ? `Approved by ${approval.user?.login ?? "a reviewer"}.`
        : "No current approving human review found.",
      status: approval ? "passed" : "pending",
      required: true,
      source: "GitHub",
      sourceUrl: approval?.html_url ?? release.prUrl,
      owner: approval?.user?.login,
      observedAt: new Date().toISOString(),
    });
  }

  return items;
}
