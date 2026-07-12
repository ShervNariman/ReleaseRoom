import { describe, expect, it } from "vitest";
import { evaluateRelease } from "@/lib/decision";
import type { ReleaseCandidate } from "@/lib/types";

const observedAt = "2026-07-10T00:00:00Z";

const base = (
  overrides: Partial<ReleaseCandidate> = {},
): ReleaseCandidate => ({
  id: "r1",
  slug: "test",
  title: "Test",
  summary: "Test release",
  owner: "Sherv",
  environment: "Production",
  repository: "o/r",
  branch: "main",
  commitSha: "abc1234",
  changedFiles: ["content/readme.md"],
  riskLevel: "low",
  createdAt: observedAt,
  updatedAt: observedAt,
  evidence: [
    {
      id: "1",
      releaseId: "r1",
      key: "acceptance-criteria",
      category: "intent",
      label: "Acceptance criteria",
      description: "yes",
      status: "passed",
      required: true,
      source: "Linear",
      observedAt,
    },
    {
      id: "2",
      releaseId: "r1",
      key: "ci",
      category: "engineering",
      label: "CI",
      description: "yes",
      status: "passed",
      required: true,
      source: "GitHub",
      observedAt,
    },
    {
      id: "3",
      releaseId: "r1",
      key: "human-review",
      category: "engineering",
      label: "Human review",
      description: "yes",
      status: "passed",
      required: true,
      source: "GitHub",
      observedAt,
    },
    {
      id: "4",
      releaseId: "r1",
      key: "preview",
      category: "operations",
      label: "Preview",
      description: "yes",
      status: "passed",
      required: true,
      source: "Vercel",
      observedAt,
    },
  ],
  audit: [],
  ...overrides,
});

describe("evaluateRelease", () => {
  it("marks a complete low-risk release ready", () => {
    expect(evaluateRelease(base()).decision).toBe("ready");
  });

  it("synthesizes missing UI proof", () => {
    const release = base({ changedFiles: ["components/button.tsx"] });
    expect(evaluateRelease(release).blockers.map((item) => item.key)).toContain(
      "mobile-visual",
    );
  });

  it("makes billing critical and blocks missing recovery", () => {
    const release = base({ changedFiles: ["app/api/stripe/route.ts"] });
    expect(evaluateRelease(release).blockers.map((item) => item.key)).toContain(
      "recovery-path",
    );
  });

  it("does not let observed evidence downgrade a policy requirement", () => {
    const release = base({
      changedFiles: ["app/api/stripe/route.ts"],
      evidence: [
        ...base().evidence,
        {
          id: "5",
          releaseId: "r1",
          key: "recovery-path",
          category: "launch",
          label: "Optional recovery",
          description: "Recovery has not been demonstrated.",
          status: "pending",
          required: false,
          source: "Manual",
          observedAt,
        },
      ],
    });
    const recovery = evaluateRelease(release).blockers.find(
      (item) => item.key === "recovery-path",
    );
    expect(recovery?.required).toBe(true);
    expect(recovery?.category).toBe("experience");
  });

  it("allows an explicit exception without hiding blockers", () => {
    const release = base({
      changedFiles: ["components/button.tsx"],
      audit: [
        {
          id: "a",
          releaseId: "r1",
          action: "override",
          actor: "Sherv",
          note: "Time-sensitive release with live monitoring",
          createdAt: "2026-07-10T01:00:00Z",
        },
      ],
    });
    const result = evaluateRelease(release);
    expect(result.decision).toBe("needs_attention");
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("honors explicit block", () => {
    const release = base({
      audit: [
        {
          id: "a",
          releaseId: "r1",
          action: "blocked",
          actor: "Sherv",
          note: "Do not ship",
          createdAt: "2026-07-10T01:00:00Z",
        },
      ],
    });
    expect(evaluateRelease(release).decision).toBe("blocked");
  });
});
