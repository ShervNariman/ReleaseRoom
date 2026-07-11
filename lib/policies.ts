import type { EvidenceCategory, RiskLevel } from "@/lib/types";

export type Requirement = { key: string; category: EvidenceCategory; label: string; description: string; required: boolean };
export type PolicyMatch = { riskLevel: RiskLevel; names: string[]; reasons: string[]; requirements: Requirement[] };

const base: Requirement[] = [
  { key: "acceptance-criteria", category: "intent", label: "Acceptance criteria", description: "The expected user outcome is explicit and testable.", required: true },
  { key: "ci", category: "engineering", label: "CI checks", description: "Lint, types, tests, and build pass for the candidate commit.", required: true },
  { key: "human-review", category: "engineering", label: "Human code review", description: "A person reviewed the material change, not only an AI reviewer.", required: true },
  { key: "preview", category: "operations", label: "Preview deployment", description: "A deployed candidate is available for review.", required: true },
];

const templates: Record<string, { level: RiskLevel; reason: string; match: (f: string) => boolean; requirements: Requirement[] }> = {
  ui: {
    level: "medium", reason: "User-facing interface changed", match: (f) => /(^|\/)(app|components|pages)\/.+\.(tsx|jsx|css)$/.test(f),
    requirements: [
      { key: "desktop-visual", category: "experience", label: "Desktop visual review", description: "Primary desktop flow was reviewed on the deployed preview.", required: true },
      { key: "mobile-visual", category: "experience", label: "Mobile visual review", description: "The flow was reviewed at a 390px mobile viewport.", required: true },
      { key: "accessibility", category: "experience", label: "Accessibility smoke test", description: "No critical or serious automated accessibility findings.", required: true },
    ],
  },
  billing: {
    level: "critical", reason: "Billing or payment code changed", match: (f) => /(stripe|billing|payment|invoice|subscription)/i.test(f),
    requirements: [
      { key: "billing-test", category: "engineering", label: "Billing integration test", description: "A staging transaction or billing integration test passed.", required: true },
      { key: "recovery-path", category: "experience", label: "Failure recovery", description: "Failed payment and recovery behavior were demonstrated.", required: true },
      { key: "rollback-owner", category: "operations", label: "Rollback owner", description: "A named person owns rollback or forward repair.", required: true },
      { key: "support-note", category: "launch", label: "Support note", description: "Customer-facing teams know what changed and how to respond.", required: true },
      { key: "founder-approval", category: "launch", label: "Founder approval", description: "A technical founder or billing owner approved production.", required: true },
    ],
  },
  auth: {
    level: "critical", reason: "Authentication or session boundary changed", match: (f) => /(auth|session|oauth|login|password)/i.test(f),
    requirements: [
      { key: "auth-test", category: "engineering", label: "Authentication tests", description: "Positive, negative, and session-expiry paths pass.", required: true },
      { key: "permission-review", category: "engineering", label: "Permission review", description: "Authorization boundaries were reviewed explicitly.", required: true },
      { key: "founder-approval", category: "launch", label: "Founder approval", description: "A human owner approved the security-sensitive change.", required: true },
    ],
  },
  database: {
    level: "critical", reason: "Database schema or migration changed", match: (f) => /(migrations?|schema|prisma|drizzle|database)/i.test(f),
    requirements: [
      { key: "migration-test", category: "engineering", label: "Migration test", description: "Migration succeeds against a representative database.", required: true },
      { key: "backup-confirmation", category: "operations", label: "Backup confirmation", description: "A current backup or recovery point is available.", required: true },
      { key: "rollback-owner", category: "operations", label: "Rollback owner", description: "A named owner can recover or forward-fix the migration.", required: true },
    ],
  },
  permissions: {
    level: "high", reason: "Roles, access, or authorization changed", match: (f) => /(permission|role|policy|rbac|acl)/i.test(f),
    requirements: [{ key: "authorization-test", category: "engineering", label: "Authorization test", description: "Allowed and denied roles are covered.", required: true }],
  },
  api: {
    level: "high", reason: "Public API contract changed", match: (f) => /(^|\/)api\//i.test(f),
    requirements: [
      { key: "contract-test", category: "engineering", label: "API contract test", description: "Backward compatibility and error shapes were checked.", required: true },
      { key: "docs-update", category: "launch", label: "Documentation update", description: "External or internal API documentation is current.", required: true },
    ],
  },
};

const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function resolvePolicy(files: string[]): PolicyMatch {
  const matched = Object.entries(templates).filter(([, t]) => files.some(t.match));
  const level = matched.reduce<RiskLevel>((current, [, t]) => rank[t.level] > rank[current] ? t.level : current, "low");
  const requirements = [...base, ...matched.flatMap(([, t]) => t.requirements)];
  const unique = [...new Map(requirements.map((r) => [r.key, r])).values()];
  return { riskLevel: level, names: matched.map(([name]) => name), reasons: matched.map(([, t]) => t.reason), requirements: unique };
}

export const policyTemplates = templates;
