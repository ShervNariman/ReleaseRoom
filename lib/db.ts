import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { resolvePolicy } from "@/lib/policies";
import type {
  AuditEvent,
  EvidenceItem,
  EvidenceStatus,
  IntegrationEvent,
  IntegrationHealth,
  IntegrationProvider,
  ReleaseCandidate,
} from "@/lib/types";

let client: Client | null = null;
let initialized = false;
let initializing: Promise<void> | null = null;

function getClient() {
  if (!client) {
    client = createClient({
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

function str(value: unknown) {
  return value == null ? null : String(value);
}

const now = () => new Date().toISOString();

export async function initializeDatabase() {
  if (initialized) return;
  if (initializing) return initializing;

  initializing = (async () => {
    const db = getClient();
    await db.batch([
      `CREATE TABLE IF NOT EXISTS releases (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL, owner TEXT NOT NULL, environment TEXT NOT NULL, repository TEXT NOT NULL, branch TEXT NOT NULL, commit_sha TEXT NOT NULL, pr_url TEXT, linear_url TEXT, preview_url TEXT, changed_files TEXT NOT NULL, risk_level TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, release_id TEXT NOT NULL, key TEXT NOT NULL, category TEXT NOT NULL, label TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, required INTEGER NOT NULL, source TEXT NOT NULL, source_url TEXT, owner TEXT, observed_at TEXT NOT NULL, UNIQUE(release_id, key), FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, release_id TEXT NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL, event_id TEXT UNIQUE, FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS integration_events (id TEXT PRIMARY KEY, provider TEXT NOT NULL, event_id TEXT UNIQUE NOT NULL, release_id TEXT, event_type TEXT NOT NULL, status TEXT NOT NULL, summary TEXT NOT NULL, actor TEXT, occurred_at TEXT NOT NULL, received_at TEXT NOT NULL, source_url TEXT, metadata TEXT NOT NULL DEFAULT '{}', FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE SET NULL)`,
      `CREATE TABLE IF NOT EXISTS integration_state (provider TEXT PRIMARY KEY, status TEXT NOT NULL, detail TEXT NOT NULL, last_event_at TEXT, last_success_at TEXT, last_error_at TEXT, last_error TEXT, event_count INTEGER NOT NULL DEFAULT 0)`,
      `CREATE INDEX IF NOT EXISTS idx_releases_repository ON releases(repository)`,
      `CREATE INDEX IF NOT EXISTS idx_releases_commit_sha ON releases(commit_sha)`,
      `CREATE INDEX IF NOT EXISTS idx_integration_events_received_at ON integration_events(received_at DESC)`,
    ]);
    initialized = true;
    await seedDatabase();
  })().finally(() => {
    initializing = null;
  });

  return initializing;
}

async function seedDatabase() {
  const db = getClient();
  const count = Number(
    (await db.execute("SELECT COUNT(*) AS count FROM releases")).rows[0]?.count ?? 0,
  );
  if (count > 0) return;

  const blockedFiles = [
    "app/api/stripe/subscription/route.ts",
    "components/billing/payment-method-form.tsx",
    "app/settings/billing/page.tsx",
  ];
  const readyFiles = [
    "app/changelog/page.tsx",
    "components/changelog/filter-bar.tsx",
  ];
  const blockedId = randomUUID();
  const readyId = randomUUID();
  const created = now();

  await db.batch([
    {
      sql: `INSERT INTO releases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        blockedId,
        "team-billing-settings",
        "Team billing settings",
        "Let workspace owners update payment methods and recover from failed payments.",
        "Sherv",
        "Production",
        "sherv/release-room-demo",
        "feature/team-billing",
        "7d92ae1",
        "https://github.com/example/release-room/pull/42",
        "https://linear.app/example/issue/RR-42",
        "https://release-room-preview.example.com/settings/billing",
        JSON.stringify(blockedFiles),
        resolvePolicy(blockedFiles).riskLevel,
        created,
        created,
      ],
    },
    {
      sql: `INSERT INTO releases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        readyId,
        "changelog-filters",
        "Changelog filters",
        "Help customers quickly find product updates by category.",
        "Maya",
        "Production",
        "sherv/release-room-demo",
        "feature/changelog-filters",
        "ca41d20",
        "https://github.com/example/release-room/pull/41",
        "https://linear.app/example/issue/RR-41",
        "https://release-room-preview.example.com/changelog",
        JSON.stringify(readyFiles),
        resolvePolicy(readyFiles).riskLevel,
        created,
        created,
      ],
    },
  ]);

  const blockedEvidence = [
    ["acceptance-criteria", "intent", "Acceptance criteria", "Requirement includes update, failure, and recovery paths.", "passed", 1, "Linear", "Product"],
    ["ci", "engineering", "CI checks", "Lint, type checking, unit tests, and production build passed.", "passed", 1, "GitHub", "CI"],
    ["human-review", "engineering", "Human code review", "Founding engineer approved the code change.", "passed", 1, "GitHub", "Ari"],
    ["preview", "operations", "Preview deployment", "Vercel preview is healthy and responding.", "passed", 1, "Vercel", "Platform"],
    ["desktop-visual", "experience", "Desktop visual review", "Billing flow reviewed at 1440px.", "passed", 1, "Playwright", "Design"],
    ["mobile-visual", "experience", "Mobile visual review", "Payment recovery alert clips at 390px width.", "failed", 1, "Playwright", "Design"],
    ["accessibility", "experience", "Accessibility smoke test", "No critical or serious findings.", "passed", 1, "axe-core", "QA"],
    ["billing-test", "engineering", "Billing integration test", "Stripe test-mode card update passed.", "passed", 1, "Stripe fixture", "Engineering"],
    ["recovery-path", "experience", "Failure recovery", "Failed payment recovery has not been demonstrated.", "pending", 1, "Release policy", "Product"],
    ["rollback-owner", "operations", "Rollback owner", "Sherv owns rollback and Stripe configuration recovery.", "passed", 1, "Manual", "Sherv"],
    ["support-note", "launch", "Support note", "Drafted but not acknowledged by customer success.", "warning", 1, "Linear", "Support"],
    ["founder-approval", "launch", "Founder approval", "Waiting for the final evidence review.", "pending", 1, "Release Room", "Sherv"],
    ["analytics-event", "launch", "Analytics event", "payment_method_updated is configured.", "passed", 0, "PostHog fixture", "Growth"],
  ] as const;

  const readyEvidence = [
    ["acceptance-criteria", "intent", "Acceptance criteria", "Filtering behavior is explicit.", "passed", 1, "Linear", "Product"],
    ["ci", "engineering", "CI checks", "All required checks passed.", "passed", 1, "GitHub", "CI"],
    ["human-review", "engineering", "Human code review", "One human approval received.", "passed", 1, "GitHub", "Noah"],
    ["preview", "operations", "Preview deployment", "Preview is live.", "passed", 1, "Vercel", "Platform"],
    ["desktop-visual", "experience", "Desktop visual review", "Reviewed at 1440px.", "passed", 1, "Playwright", "Design"],
    ["mobile-visual", "experience", "Mobile visual review", "Reviewed at 390px.", "passed", 1, "Playwright", "Design"],
    ["accessibility", "experience", "Accessibility smoke test", "No critical or serious findings.", "passed", 1, "axe-core", "QA"],
  ] as const;

  for (const [releaseId, items] of [
    [blockedId, blockedEvidence],
    [readyId, readyEvidence],
  ] as const) {
    for (const item of items) {
      await db.execute({
        sql: `INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          randomUUID(),
          releaseId,
          ...item.slice(0, 7),
          null,
          item[7],
          created,
        ],
      });
    }
    await db.execute({
      sql: `INSERT INTO audit_events VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        releaseId,
        "created",
        "Release Room",
        "Release candidate created and policy resolved.",
        created,
        `seed-${releaseId}`,
      ],
    });
  }
}

function mapEvidence(row: Record<string, unknown>): EvidenceItem {
  return {
    id: String(row.id),
    releaseId: String(row.release_id),
    key: String(row.key),
    category: row.category as EvidenceItem["category"],
    label: String(row.label),
    description: String(row.description),
    status: row.status as EvidenceStatus,
    required: Number(row.required) === 1,
    source: String(row.source),
    sourceUrl: str(row.source_url),
    owner: str(row.owner),
    observedAt: String(row.observed_at),
  };
}

function mapAudit(row: Record<string, unknown>): AuditEvent {
  return {
    id: String(row.id),
    releaseId: String(row.release_id),
    action: row.action as AuditEvent["action"],
    actor: String(row.actor),
    note: String(row.note),
    createdAt: String(row.created_at),
  };
}

async function hydrate(row: Record<string, unknown>): Promise<ReleaseCandidate> {
  const db = getClient();
  const evidence = (
    await db.execute({
      sql: "SELECT * FROM evidence WHERE release_id = ? ORDER BY category, required DESC, label",
      args: [row.id as string],
    })
  ).rows.map((item) => mapEvidence(item as Record<string, unknown>));
  const audit = (
    await db.execute({
      sql: "SELECT * FROM audit_events WHERE release_id = ? ORDER BY created_at",
      args: [row.id as string],
    })
  ).rows.map((item) => mapAudit(item as Record<string, unknown>));

  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    owner: String(row.owner),
    environment: String(row.environment),
    repository: String(row.repository),
    branch: String(row.branch),
    commitSha: String(row.commit_sha),
    prUrl: str(row.pr_url),
    linearUrl: str(row.linear_url),
    previewUrl: str(row.preview_url),
    changedFiles: JSON.parse(String(row.changed_files)) as string[],
    riskLevel: row.risk_level as ReleaseCandidate["riskLevel"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    evidence,
    audit,
  };
}

export async function listReleases() {
  await initializeDatabase();
  const rows = (
    await getClient().execute("SELECT * FROM releases ORDER BY updated_at DESC")
  ).rows;
  return Promise.all(rows.map((row) => hydrate(row as Record<string, unknown>)));
}

export async function getRelease(slug: string) {
  await initializeDatabase();
  const row = (
    await getClient().execute({
      sql: "SELECT * FROM releases WHERE slug = ?",
      args: [slug],
    })
  ).rows[0];
  return row ? hydrate(row as Record<string, unknown>) : null;
}

export async function createRelease(input: {
  title: string;
  summary: string;
  owner: string;
  environment: string;
  repository: string;
  branch: string;
  commitSha: string;
  prUrl?: string;
  linearUrl?: string;
  previewUrl?: string;
  changedFiles: string[];
}) {
  await initializeDatabase();
  const db = getClient();
  const id = randomUUID();
  const created = now();
  const slugBase =
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "release";
  const slug = `${slugBase}-${id.slice(0, 6)}`;
  const policy = resolvePolicy(input.changedFiles);

  await db.execute({
    sql: `INSERT INTO releases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      slug,
      input.title,
      input.summary,
      input.owner,
      input.environment,
      input.repository,
      input.branch,
      input.commitSha,
      input.prUrl || null,
      input.linearUrl || null,
      input.previewUrl || null,
      JSON.stringify(input.changedFiles),
      policy.riskLevel,
      created,
      created,
    ],
  });

  for (const requirement of policy.requirements) {
    await upsertEvidence(slug, {
      key: requirement.key,
      category: requirement.category,
      label: requirement.label,
      description: requirement.description,
      status: "pending",
      required: requirement.required,
      source: "Release policy",
    });
  }

  await addAudit(
    slug,
    "created",
    input.owner,
    `Release created with ${policy.riskLevel} risk policy.`,
  );
  return slug;
}

export async function upsertEvidence(
  slug: string,
  item: Omit<EvidenceItem, "id" | "releaseId" | "observedAt"> & {
    observedAt?: string;
  },
) {
  await initializeDatabase();
  const db = getClient();
  const release = (
    await db.execute({
      sql: "SELECT id FROM releases WHERE slug = ?",
      args: [slug],
    })
  ).rows[0];
  if (!release) throw new Error("Release not found");

  const observed = item.observedAt ?? now();
  await db.execute({
    sql: `INSERT INTO evidence (id, release_id, key, category, label, description, status, required, source, source_url, owner, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(release_id, key) DO UPDATE SET category=excluded.category,label=excluded.label,description=excluded.description,status=excluded.status,required=excluded.required,source=excluded.source,source_url=excluded.source_url,owner=excluded.owner,observed_at=excluded.observed_at`,
    args: [
      randomUUID(),
      release.id as string,
      item.key,
      item.category,
      item.label,
      item.description,
      item.status,
      item.required ? 1 : 0,
      item.source,
      item.sourceUrl ?? null,
      item.owner ?? null,
      observed,
    ],
  });
  await db.execute({
    sql: "UPDATE releases SET updated_at = ? WHERE id = ?",
    args: [observed, release.id as string],
  });
}

export async function addAudit(
  slug: string,
  action: AuditEvent["action"],
  actor: string,
  note: string,
  eventId?: string,
) {
  await initializeDatabase();
  const db = getClient();
  const release = (
    await db.execute({
      sql: "SELECT id FROM releases WHERE slug = ?",
      args: [slug],
    })
  ).rows[0];
  if (!release) throw new Error("Release not found");

  await db.execute({
    sql: `INSERT OR IGNORE INTO audit_events VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      release.id as string,
      action,
      actor,
      note,
      now(),
      eventId ?? null,
    ],
  });
}

export async function hasAuditEvent(eventId: string) {
  await initializeDatabase();
  const row = (
    await getClient().execute({
      sql: "SELECT 1 AS found FROM audit_events WHERE event_id = ? LIMIT 1",
      args: [eventId],
    })
  ).rows[0];
  return Boolean(row);
}

function mapIntegrationEvent(row: Record<string, unknown>): IntegrationEvent {
  return {
    id: String(row.id),
    provider: row.provider as IntegrationProvider,
    eventId: String(row.event_id),
    releaseSlug: str(row.release_slug),
    eventType: String(row.event_type),
    status: row.status as IntegrationEvent["status"],
    summary: String(row.summary),
    actor: str(row.actor),
    occurredAt: String(row.occurred_at),
    receivedAt: String(row.received_at),
    sourceUrl: str(row.source_url),
  };
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.host.toLowerCase()}${url.pathname.replace(/\/$/, "")}${url.search}`;
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
  }
}

function shasMatch(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (a.length < 7 || b.length < 7) return a === b;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

async function uniqueHydrated(rows: Array<Record<string, unknown>>) {
  return rows.length === 1 ? hydrate(rows[0]) : null;
}

export async function findReleaseForEvent(input: {
  commitSha?: string | null;
  repository?: string | null;
  prUrl?: string | null;
  linearIdentifier?: string | null;
  previewUrl?: string | null;
}) {
  await initializeDatabase();
  const db = getClient();

  if (input.prUrl) {
    const normalized = normalizeUrl(input.prUrl);
    const rows = (
      await db.execute(
        "SELECT * FROM releases WHERE pr_url IS NOT NULL ORDER BY updated_at DESC LIMIT 200",
      )
    ).rows.filter(
      (row) => normalizeUrl(str(row.pr_url)) === normalized,
    ) as Array<Record<string, unknown>>;
    const release = await uniqueHydrated(rows);
    if (release) return release;
  }

  if (input.commitSha) {
    const repository = input.repository?.trim().toLowerCase() ?? null;
    const rows = (
      await db.execute({
        sql: repository
          ? "SELECT * FROM releases WHERE lower(repository) = ? ORDER BY updated_at DESC LIMIT 200"
          : "SELECT * FROM releases ORDER BY updated_at DESC LIMIT 200",
        args: repository ? [repository] : [],
      })
    ).rows.filter((row) =>
      shasMatch(String(row.commit_sha), input.commitSha as string),
    ) as Array<Record<string, unknown>>;
    const release = await uniqueHydrated(rows);
    if (release) return release;
  }

  if (input.linearIdentifier) {
    const rows = (
      await db.execute({
        sql: "SELECT * FROM releases WHERE lower(linear_url) LIKE ? ORDER BY updated_at DESC LIMIT 2",
        args: [`%/issue/${input.linearIdentifier.toLowerCase()}%`],
      })
    ).rows as Array<Record<string, unknown>>;
    const release = await uniqueHydrated(rows);
    if (release) return release;
  }

  if (input.previewUrl) {
    const normalized = normalizeUrl(input.previewUrl);
    const rows = (
      await db.execute(
        "SELECT * FROM releases WHERE preview_url IS NOT NULL ORDER BY updated_at DESC LIMIT 200",
      )
    ).rows.filter(
      (row) => normalizeUrl(str(row.preview_url)) === normalized,
    ) as Array<Record<string, unknown>>;
    const release = await uniqueHydrated(rows);
    if (release) return release;
  }

  return null;
}

export async function hasIntegrationEvent(eventId: string) {
  await initializeDatabase();
  const row = (
    await getClient().execute({
      sql: "SELECT 1 AS found FROM integration_events WHERE event_id = ? LIMIT 1",
      args: [eventId],
    })
  ).rows[0];
  return Boolean(row);
}

export async function recordIntegrationEvent(input: {
  provider: IntegrationProvider;
  eventId: string;
  releaseSlug?: string | null;
  eventType: string;
  status: IntegrationEvent["status"];
  summary: string;
  actor?: string | null;
  occurredAt?: string;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await initializeDatabase();
  const db = getClient();
  if (await hasIntegrationEvent(input.eventId)) return { duplicate: true };

  let releaseId: string | null = null;
  if (input.releaseSlug) {
    const release = (
      await db.execute({
        sql: "SELECT id FROM releases WHERE slug = ?",
        args: [input.releaseSlug],
      })
    ).rows[0];
    releaseId = release ? String(release.id) : null;
  }

  const receivedAt = now();
  try {
    await db.execute({
      sql: `INSERT INTO integration_events (id, provider, event_id, release_id, event_type, status, summary, actor, occurred_at, received_at, source_url, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        input.provider,
        input.eventId,
        releaseId,
        input.eventType,
        input.status,
        input.summary,
        input.actor ?? null,
        input.occurredAt ?? receivedAt,
        receivedAt,
        input.sourceUrl ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    });
  } catch (error) {
    if (await hasIntegrationEvent(input.eventId)) return { duplicate: true };
    throw error;
  }

  const success = input.status !== "failed";
  await db.execute({
    sql: `INSERT INTO integration_state (provider, status, detail, last_event_at, last_success_at, last_error_at, last_error, event_count) VALUES (?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(provider) DO UPDATE SET status=excluded.status, detail=excluded.detail, last_event_at=excluded.last_event_at, last_success_at=CASE WHEN ? THEN excluded.last_success_at ELSE integration_state.last_success_at END, last_error_at=CASE WHEN ? THEN integration_state.last_error_at ELSE excluded.last_error_at END, last_error=CASE WHEN ? THEN integration_state.last_error ELSE excluded.last_error END, event_count=integration_state.event_count+1`,
    args: [
      input.provider,
      success ? "connected" : "degraded",
      input.summary,
      receivedAt,
      success ? receivedAt : null,
      success ? null : receivedAt,
      success ? null : input.summary,
      success ? 1 : 0,
      success ? 1 : 0,
      success ? 1 : 0,
    ],
  });
  return { duplicate: false };
}

export async function listIntegrationEvents(limit = 20) {
  await initializeDatabase();
  const boundedLimit = Math.max(1, Math.min(limit, 250));
  const rows = (
    await getClient().execute({
      sql: `SELECT ie.*, r.slug AS release_slug FROM integration_events ie LEFT JOIN releases r ON r.id = ie.release_id ORDER BY ie.received_at DESC LIMIT ?`,
      args: [boundedLimit],
    })
  ).rows;
  return rows.map((row) => mapIntegrationEvent(row as Record<string, unknown>));
}

export async function listIntegrationStates() {
  await initializeDatabase();
  const rows = (
    await getClient().execute("SELECT * FROM integration_state ORDER BY provider")
  ).rows;
  return rows.map((row) => ({
    provider: String(row.provider) as IntegrationProvider,
    status: String(row.status) as IntegrationHealth["status"],
    detail: String(row.detail),
    lastSync: str(row.last_event_at),
    lastSuccess: str(row.last_success_at),
    eventCount: Number(row.event_count ?? 0),
    lastError: str(row.last_error),
  }));
}

export async function databaseReady() {
  try {
    await initializeDatabase();
    await getClient().execute("SELECT 1 AS ready");
    return true;
  } catch {
    return false;
  }
}

export async function resetDatabase() {
  const db = getClient();
  await db.batch([
    "DROP TABLE IF EXISTS integration_state",
    "DROP TABLE IF EXISTS integration_events",
    "DROP TABLE IF EXISTS audit_events",
    "DROP TABLE IF EXISTS evidence",
    "DROP TABLE IF EXISTS releases",
  ]);
  initialized = false;
  initializing = null;
  await initializeDatabase();
}
