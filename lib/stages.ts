import { effectiveEvidence } from "@/lib/decision";
import type { EvidenceStatus, ReleaseCandidate } from "@/lib/types";

export type ReleaseStage = { name: string; status: EvidenceStatus | "upcoming" };

function combine(statuses: EvidenceStatus[]): EvidenceStatus | "upcoming" {
  if (!statuses.length) return "upcoming";
  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("warning")) return "warning";
  return "passed";
}

export function releaseStages(release: ReleaseCandidate): ReleaseStage[] {
  const evidence = effectiveEvidence(release);
  const byKey = (keys: string[]) => combine(evidence.filter((item) => keys.includes(item.key)).map((item) => item.status));
  const approved = release.audit.some((event) => event.action === "approved" || event.action === "override");
  return [
    { name: "Intent", status: byKey(["acceptance-criteria"]) },
    { name: "Code", status: byKey(["ci", "human-review"]) },
    { name: "Preview", status: byKey(["preview", "desktop-visual", "mobile-visual"]) },
    { name: "Approval", status: approved ? "passed" : byKey(["founder-approval"]) },
    { name: "Production", status: byKey(["production-deployment"]) },
    { name: "Observe", status: byKey(["observation-window", "release-health", "analytics-event"]) },
  ];
}
