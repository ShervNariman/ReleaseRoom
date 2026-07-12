import { describe, expect, it } from "vitest";
import { parseReleaseInput } from "@/lib/release-input";

const valid = {
  title: "Billing recovery",
  summary: "Make failed-payment recovery safe for customers.",
  owner: "Sherv",
  environment: "Production",
  repository: "ShervNariman/ReleaseRoom",
  branch: "feature/billing-recovery",
  commitSha: "ABCDEF1234567890",
  prUrl: "https://github.com/ShervNariman/ReleaseRoom/pull/42",
  linearUrl:
    "https://linear.app/sherv-nariman/issue/SHE-42/billing-recovery",
  previewUrl: "https://billing-preview.vercel.app",
  changedFiles:
    "./app/api/stripe/route.ts\ncomponents\\billing\\form.tsx\napp/api/stripe/route.ts",
};

describe("release input", () => {
  it("normalizes release identifiers and deduplicates changed files", () => {
    const result = parseReleaseInput(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.commitSha).toBe("abcdef1234567890");
    expect(result.data.changedFiles).toEqual([
      "app/api/stripe/route.ts",
      "components/billing/form.tsx",
    ]);
  });

  it("accepts a GitHub repository URL and normalizes it", () => {
    const result = parseReleaseInput({
      ...valid,
      repository: "https://github.com/ShervNariman/ReleaseRoom.git",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.repository).toBe("ShervNariman/ReleaseRoom");
    }
  });

  it("rejects a pull request from another repository", () => {
    const result = parseReleaseInput({
      ...valid,
      prUrl: "https://github.com/ShervNariman/EdgeLens/pull/42",
    });
    expect(result).toEqual({
      success: false,
      error: "PR URL must belong to the release repository.",
    });
  });

  it("rejects non-hexadecimal commit identifiers", () => {
    const result = parseReleaseInput({ ...valid, commitSha: "release-42" });
    expect(result.success).toBe(false);
  });

  it("rejects repository traversal in changed files", () => {
    const result = parseReleaseInput({
      ...valid,
      changedFiles: "../secrets.env",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a generic Linear URL that is not an issue", () => {
    const result = parseReleaseInput({
      ...valid,
      linearUrl: "https://linear.app/sherv-nariman/team/SHE/all",
    });
    expect(result.success).toBe(false);
  });
});
