export const evidenceCategories = [
  "intent",
  "engineering",
  "experience",
  "operations",
  "launch",
] as const;
export type EvidenceCategory = (typeof evidenceCategories)[number];
export type EvidenceStatus = "passed" | "warning" | "failed" | "pending";
export type ReleaseDecision = "ready" | "needs_attention" | "blocked";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type IntegrationProvider =
  | "github"
  | "linear"
  | "vercel"
  | "editor"
  | "webhook";

export type EvidenceItem = {
  id: string;
  releaseId: string;
  key: string;
  category: EvidenceCategory;
  label: string;
  description: string;
  status: EvidenceStatus;
  required: boolean;
  source: string;
  sourceUrl?: string | null;
  owner?: string | null;
  observedAt: string;
};

export type ReleaseCandidate = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  owner: string;
  environment: string;
  repository: string;
  branch: string;
  commitSha: string;
  prUrl?: string | null;
  linearUrl?: string | null;
  previewUrl?: string | null;
  changedFiles: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  evidence: EvidenceItem[];
  audit: AuditEvent[];
};

export type AuditEvent = {
  id: string;
  releaseId: string;
  action:
    | "created"
    | "evidence_added"
    | "refreshed"
    | "approved"
    | "blocked"
    | "override";
  actor: string;
  note: string;
  createdAt: string;
};

export type DecisionResult = {
  decision: ReleaseDecision;
  headline: string;
  summary: string;
  blockers: EvidenceItem[];
  warnings: EvidenceItem[];
  requiredCount: number;
  passedRequiredCount: number;
  override?: AuditEvent;
};

export type IntegrationEvent = {
  id: string;
  provider: IntegrationProvider;
  eventId: string;
  releaseSlug?: string | null;
  eventType: string;
  status: "processed" | "ignored" | "failed";
  summary: string;
  actor?: string | null;
  occurredAt: string;
  receivedAt: string;
  sourceUrl?: string | null;
};

export type IntegrationHealth = {
  provider: IntegrationProvider;
  name: string;
  status: "connected" | "configured" | "fixture" | "degraded" | "stale";
  detail: string;
  lastSync?: string | null;
  lastSuccess?: string | null;
  lastError?: string | null;
  eventCount?: number;
  endpoint?: string;
  permissions: string[];
};

export type DashboardSnapshot = {
  generatedAt: string;
  releases: ReleaseCandidate[];
  integrations: IntegrationHealth[];
  events: IntegrationEvent[];
  metrics: {
    active: number;
    blocked: number;
    proofCompletion: number;
    waitingMinutes: number;
  };
};
