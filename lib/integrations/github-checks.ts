import { getRelease } from "@/lib/db";
import { evaluateRelease } from "@/lib/decision";
import { env } from "@/lib/env";
import { releaseIntegrationContext } from "@/lib/integrations/context";
import type { DecisionResult, ReleaseCandidate } from "@/lib/types";

export const RELEASE_ROOM_CHECK_NAME = "Release Room / Product readiness";

type PublishResult =
  | {
      published: false;
      reason: "disabled" | "not-configured" | "release-not-found";
    }
  | { published: true; url?: string };

function checkPayload(release: ReleaseCandidate, result: DecisionResult) {
  const conclusion =
    result.decision === "ready"
      ? "success"
      : result.decision === "blocked"
        ? "failure"
        : "neutral";
  const blockers = result.blockers.length
    ? result.blockers
        .map((item) => `- ${item.label}: ${item.description}`)
        .join("\n")
    : "- No required proof is missing.";

  return {
    name: RELEASE_ROOM_CHECK_NAME,
    head_sha: release.commitSha,
    status: "completed",
    conclusion,
    ...(env.RELEASE_ROOM_PUBLIC_URL
      ? {
          details_url: `${env.RELEASE_ROOM_PUBLIC_URL}/releases/${release.slug}`,
        }
      : {}),
    output: {
      title: result.headline,
      summary: result.summary,
      text: `Required proof: ${result.passedRequiredCount}/${result.requiredCount}\n\n${blockers}`.slice(
        0,
        65_000,
      ),
    },
  };
}

function repositoryPath(repository: string) {
  return repository
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export async function publishGitHubDecision(
  release: ReleaseCandidate,
  result: DecisionResult,
): Promise<PublishResult> {
  if (env.GITHUB_CHECKS_ENABLED !== "true") {
    return { published: false, reason: "disabled" };
  }

  const repository = releaseIntegrationContext(release).repository;
  if (!env.GITHUB_TOKEN || !repository) {
    return { published: false, reason: "not-configured" };
  }

  const response = await fetch(
    `https://api.github.com/repos/${repositoryPath(repository)}/check-runs`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      body: JSON.stringify(checkPayload(release, result)),
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub check publish failed (${response.status})`);
  }

  const body = (await response.json()) as { html_url?: string };
  return { published: true, url: body.html_url };
}

export async function publishGitHubDecisionForSlug(
  slug: string,
): Promise<PublishResult> {
  const release = await getRelease(slug);
  if (!release) return { published: false, reason: "release-not-found" };
  return publishGitHubDecision(release, evaluateRelease(release));
}
