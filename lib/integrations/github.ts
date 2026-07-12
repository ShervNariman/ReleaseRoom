import { env } from "@/lib/env";
import { RELEASE_ROOM_CHECK_NAME } from "@/lib/integrations/github-checks";
import { releaseIntegrationContext } from "@/lib/integrations/context";
import { fetchJson } from "@/lib/integrations/http";
import type {
  EvidenceItem,
  EvidenceStatus,
  ReleaseCandidate,
} from "@/lib/types";

export type GitHubCheck = {
  name: string;
  conclusion: string | null;
  details_url?: string;
  html_url?: string;
};

type CheckRuns = {
  total_count: number;
  check_runs: GitHubCheck[];
};

type Reviews = Array<{
  state: string;
  user?: { login?: string };
  html_url?: string;
  submitted_at?: string;
}>;

const passingConclusions = new Set(["success", "neutral", "skipped"]);
const failingConclusions = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
  "startup_failure",
]);

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

export function githubCheckStatus(checks: GitHubCheck[]): EvidenceStatus {
  if (checks.length === 0) return "pending";
  if (
    checks.some((check) =>
      failingConclusions.has((check.conclusion ?? "").toLowerCase()),
    )
  ) {
    return "failed";
  }
  if (
    checks.every((check) =>
      passingConclusions.has((check.conclusion ?? "").toLowerCase()),
    )
  ) {
    return "passed";
  }
  return "pending";
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
  const status = githubCheckStatus(relevantChecks);
  const successfulCount = relevantChecks.filter((run) =>
    passingConclusions.has((run.conclusion ?? "").toLowerCase()),
  ).length;
  const pendingCount = relevantChecks.filter(
    (run) => !run.conclusion,
  ).length;
  const description =
    relevantChecks.length === 0
      ? "No external GitHub checks were reported for this commit."
      : status === "pending"
        ? `${successfulCount}/${relevantChecks.length} GitHub checks passed; ${pendingCount || relevantChecks.length - successfulCount} still pending or inconclusive.`
        : `${successfulCount}/${relevantChecks.length} GitHub checks passed.`;

  const items: Array<Omit<EvidenceItem, "id" | "releaseId">> = [
    {
      key: "ci",
      category: "engineering",
      label: "CI checks",
      description,
      status,
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
