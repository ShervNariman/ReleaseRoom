import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySessionToken } from "@/lib/auth";
import { accessKey, sessionSecret } from "@/lib/env";
import { releaseIntegrationContext } from "@/lib/integrations/context";
import {
  selectDeploymentForCommit,
  type VercelDeployment,
} from "@/lib/integrations/vercel";
import type { ReleaseCandidate } from "@/lib/types";

function release(
  overrides: Partial<ReleaseCandidate> = {},
): ReleaseCandidate {
  return {
    id: "release-1",
    slug: "billing-release",
    title: "Billing release",
    summary: "Billing workflow",
    owner: "Sherv",
    environment: "Production",
    repository: "ShervNariman/ReleaseRoom",
    branch: "feature/billing",
    commitSha: "abcdef1234567890",
    prUrl: "https://github.com/ShervNariman/ReleaseRoom/pull/42",
    linearUrl: "https://linear.app/sherv-nariman/issue/SHE-42/billing",
    previewUrl: "https://billing-preview.vercel.app",
    changedFiles: ["app/billing/page.tsx"],
    riskLevel: "high",
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
    evidence: [],
    audit: [],
    ...overrides,
  };
}

function sessionToken(issuedAt: number) {
  const signature = createHmac("sha256", sessionSecret)
    .update(`session:${issuedAt}:${accessKey}`)
    .digest("hex");
  return `${issuedAt}.${signature}`;
}

describe("production hardening", () => {
  it("derives provider identifiers from the release instead of global defaults", () => {
    expect(releaseIntegrationContext(release())).toEqual({
      repository: "ShervNariman/ReleaseRoom",
      pullRequestNumber: 42,
      linearIssueId: "SHE-42",
      commitSha: "abcdef1234567890",
      previewUrl: "https://billing-preview.vercel.app",
    });
  });

  it("falls back to the PR URL only when the repository field is invalid", () => {
    expect(
      releaseIntegrationContext(release({ repository: "not-a-repository" }))
        .repository,
    ).toBe("ShervNariman/ReleaseRoom");
  });

  it("never falls back to an unrelated Vercel deployment", () => {
    const deployments: VercelDeployment[] = [
      {
        uid: "wrong",
        url: "wrong.vercel.app",
        state: "READY",
        meta: { githubCommitSha: "1111111111111111" },
      },
    ];
    expect(
      selectDeploymentForCommit(deployments, "abcdef1234567890"),
    ).toBeUndefined();
  });

  it("matches short and full SHAs for the same Vercel commit", () => {
    const deployment: VercelDeployment = {
      uid: "right",
      url: "right.vercel.app",
      state: "READY",
      meta: { githubCommitSha: "abcdef1234567890" },
    };
    expect(selectDeploymentForCommit([deployment], "abcdef1")).toBe(
      deployment,
    );
  });

  it("accepts a fresh signed session and rejects expired or future sessions", () => {
    const now = Date.UTC(2026, 6, 12, 1, 0, 0);
    const nowSeconds = Math.floor(now / 1000);
    expect(verifySessionToken(sessionToken(nowSeconds), now)).toBe(true);
    expect(
      verifySessionToken(sessionToken(nowSeconds - 15 * 24 * 60 * 60), now),
    ).toBe(false);
    expect(verifySessionToken(sessionToken(nowSeconds + 120), now)).toBe(false);
    expect(verifySessionToken("malformed", now)).toBe(false);
  });
});
