import { resolvePolicy } from "@/lib/policies";
import type {
  DecisionResult,
  EvidenceItem,
  ReleaseCandidate,
} from "@/lib/types";

export function effectiveEvidence(release: ReleaseCandidate): EvidenceItem[] {
  const policy = resolvePolicy(release.changedFiles);
  const byKey = new Map(release.evidence.map((item) => [item.key, item]));
  const synthesized: EvidenceItem[] = policy.requirements.map((requirement) => {
    const observed = byKey.get(requirement.key);
    if (observed) {
      return {
        ...observed,
        category: requirement.category,
        label: requirement.label,
        required: requirement.required,
      };
    }
    return {
      id: `missing-${requirement.key}`,
      releaseId: release.id,
      key: requirement.key,
      category: requirement.category,
      label: requirement.label,
      description: requirement.description,
      status: "pending",
      required: requirement.required,
      source: "Release policy",
      observedAt: release.updatedAt,
    };
  });
  const policyKeys = new Set(
    policy.requirements.map((requirement) => requirement.key),
  );
  const extras = release.evidence.filter((item) => !policyKeys.has(item.key));
  return [...synthesized, ...extras];
}

export function evaluateRelease(release: ReleaseCandidate): DecisionResult {
  const evidence = effectiveEvidence(release);
  const blockers = evidence.filter(
    (item) => item.required && item.status !== "passed",
  );
  const warnings = evidence.filter(
    (item) => !item.required && item.status !== "passed",
  );
  const latestDecision = [...release.audit]
    .reverse()
    .find((event) =>
      ["approved", "blocked", "override"].includes(event.action),
    );
  const override =
    latestDecision?.action === "override" ? latestDecision : undefined;
  const explicitlyBlocked = latestDecision?.action === "blocked";
  const decision = explicitlyBlocked
    ? "blocked"
    : blockers.length === 0
      ? "ready"
      : override
        ? "needs_attention"
        : "blocked";
  const required = evidence.filter((item) => item.required);
  const passed = required.filter((item) => item.status === "passed");
  const headline =
    decision === "ready"
      ? "Ready for production"
      : decision === "needs_attention"
        ? "Approved with exception"
        : "Blocked from release";
  const summary =
    decision === "ready"
      ? "Every required proof is present. The release can move forward."
      : decision === "needs_attention"
        ? `${blockers.length} required item${
            blockers.length === 1 ? " remains" : "s remain"
          }, with a documented human exception.`
        : `${blockers.length} required proof${
            blockers.length === 1 ? " is" : "s are"
          } missing or failing.`;
  return {
    decision,
    headline,
    summary,
    blockers,
    warnings,
    requiredCount: required.length,
    passedRequiredCount: passed.length,
    override,
  };
}
