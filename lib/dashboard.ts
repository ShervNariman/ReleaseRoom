import { listIntegrationEvents, listReleases } from "@/lib/db";
import { evaluateRelease } from "@/lib/decision";
import { integrationHealth } from "@/lib/integrations/health";
import type { DashboardSnapshot } from "@/lib/types";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [releases, integrations, events] = await Promise.all([listReleases(), integrationHealth(), listIntegrationEvents(30)]);
  const results = releases.map((release) => evaluateRelease(release));
  const required = results.reduce((sum, result) => sum + result.requiredCount, 0);
  const passed = results.reduce((sum, result) => sum + result.passedRequiredCount, 0);
  const pendingAudit = releases.flatMap((release) => release.audit).filter((event) => ["created", "evidence_added", "refreshed"].includes(event.action));
  const oldest = pendingAudit.length ? Math.min(...pendingAudit.map((event) => new Date(event.createdAt).getTime())) : Date.now();
  return {
    generatedAt: new Date().toISOString(),
    releases,
    integrations,
    events,
    metrics: {
      active: releases.length,
      blocked: results.filter((result) => result.decision === "blocked").length,
      proofCompletion: required ? Math.round((passed / required) * 100) : 100,
      waitingMinutes: Math.max(0, Math.round((Date.now() - oldest) / 60_000)),
    },
  };
}
