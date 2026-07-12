import { describe, expect, it } from "vitest";
import { githubCheckStatus } from "@/lib/integrations/github";

describe("GitHub evidence status", () => {
  it("keeps running checks pending", () => {
    expect(
      githubCheckStatus([
        { name: "lint", conclusion: "success" },
        { name: "build", conclusion: null },
      ]),
    ).toBe("pending");
  });

  it("fails when any required check explicitly fails", () => {
    expect(
      githubCheckStatus([
        { name: "lint", conclusion: "success" },
        { name: "build", conclusion: "failure" },
      ]),
    ).toBe("failed");
  });

  it("passes only when all checks have acceptable terminal conclusions", () => {
    expect(
      githubCheckStatus([
        { name: "lint", conclusion: "success" },
        { name: "docs", conclusion: "skipped" },
        { name: "advisory", conclusion: "neutral" },
      ]),
    ).toBe("passed");
  });

  it("keeps an empty check set pending", () => {
    expect(githubCheckStatus([])).toBe("pending");
  });
});
