import type { ReleaseCandidate } from "@/lib/types";

export type ReleaseIntegrationContext = {
  repository: string | null;
  pullRequestNumber: number | null;
  linearIssueId: string | null;
  commitSha: string;
  previewUrl: string | null;
};

function repositoryFromPullRequest(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/\d+\/?$/i);
    return match ? `${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

function normalizeRepository(value: string | null | undefined) {
  const trimmed = value?.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  return trimmed && /^[^/\s]+\/[^/\s]+$/.test(trimmed) ? trimmed : null;
}

function pullRequestNumber(url: string | null | undefined) {
  if (!url) return null;
  try {
    const match = new URL(url).pathname.match(/\/pull\/(\d+)\/?$/i);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function linearIssueId(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const issueIndex = parts.findIndex((part) => part.toLowerCase() === "issue");
    return issueIndex >= 0 && parts[issueIndex + 1] ? parts[issueIndex + 1] : null;
  } catch {
    return null;
  }
}

export function releaseIntegrationContext(release: ReleaseCandidate): ReleaseIntegrationContext {
  return {
    repository: normalizeRepository(release.repository) ?? repositoryFromPullRequest(release.prUrl),
    pullRequestNumber: pullRequestNumber(release.prUrl),
    linearIssueId: linearIssueId(release.linearUrl),
    commitSha: release.commitSha,
    previewUrl: release.previewUrl ?? null,
  };
}
