import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  PlugZap,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { Card, Pill } from "@/components/ui";
import { integrationHealth } from "@/lib/integrations/health";
import type { IntegrationHealth } from "@/lib/types";

function tone(status: IntegrationHealth["status"]) {
  if (status === "connected") return "green" as const;
  if (status === "configured") return "purple" as const;
  if (status === "degraded") return "red" as const;
  if (status === "stale") return "amber" as const;
  return "slate" as const;
}

function icon(status: IntegrationHealth["status"]) {
  if (status === "connected") return CheckCircle2;
  if (status === "configured") return PlugZap;
  if (status === "degraded") return AlertTriangle;
  if (status === "stale") return Clock3;
  return CircleDashed;
}

function iconTone(status: IntegrationHealth["status"]) {
  if (status === "connected") return "text-emerald-600";
  if (status === "configured") return "text-violet-600";
  if (status === "degraded") return "text-red-600";
  if (status === "stale") return "text-amber-600";
  return "text-slate-500";
}

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const integrations = await integrationHealth();
  const connected = integrations.filter(
    (integration) => integration.status === "connected",
  ).length;

  return (
    <div className="space-y-7">
      <div>
        <p className="eyebrow">INTEGRATIONS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
          Know what is configured—and what has actually proven itself.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Tokens and signing secrets only move a provider to configured. Release
          Room marks it connected after the first verified live event, and flags
          stale or degraded evidence instead of presenting a false green state.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {connected} of {integrations.length} evidence paths verified live
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fixture mode is safe for evaluation. Use configured and connected
              states to prepare a real pilot.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Integration status legend">
            <Pill tone="green">Connected</Pill>
            <Pill tone="purple">Configured</Pill>
            <Pill tone="amber">Stale</Pill>
            <Pill tone="red">Degraded</Pill>
            <Pill tone="slate">Fixture</Pill>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {integrations.map((item) => {
          const Icon = icon(item.status);
          return (
            <Card key={item.provider} className="overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100">
                      <Icon className={`size-5 ${iconTone(item.status)}`} aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-semibold text-slate-950">{item.name}</h2>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <Pill tone={tone(item.status)}>{item.status}</Pill>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Clock3 className="size-3.5" aria-hidden />
                      Last verified event
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {item.lastSync
                        ? new Date(item.lastSync).toLocaleString()
                        : "Waiting for first event"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.eventCount ?? 0} events received
                    </p>
                    {item.lastError ? (
                      <p className="mt-2 text-xs font-medium text-red-700">
                        Last error: {item.lastError}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Radio className="size-3.5" aria-hidden />
                      Endpoint
                    </div>
                    <code className="mt-2 block overflow-x-auto text-xs font-semibold text-slate-700">
                      {item.endpoint}
                    </code>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-slate-500" aria-hidden />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Access boundary
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                    {item.permissions.map((permission) => (
                      <li key={permission} className="flex gap-2">
                        <span className="text-slate-400">•</span>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Recommended activation order
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Link each release to its own repository, PR, issue, and commit. Do
              not rely on one global demo identifier for multiple releases.
            </p>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-3 xl:max-w-3xl xl:grid-cols-6">
            {[
              "Add provider credentials",
              "Create a linked release",
              "Run read-only refresh",
              "Register signed webhooks",
              "Send an editor report",
              "Confirm first live event",
            ].map((step, index) => (
              <div key={step} className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs font-semibold text-violet-700">
                  0{index + 1}
                </span>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-800">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-950">Editor bridge quick start</h2>
        <p className="mt-1 text-sm text-slate-500">
          Run from Cursor, Codex, Claude Code, or any integrated terminal.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          <code>{`release-room complete \\
  --release team-billing-settings \\
  --editor Cursor \\
  --model "Grok 4.5 Very Fast" \\
  --task SHE-71 \\
  --checks lint,typecheck,test,build`}</code>
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          See <code>docs/EDITOR-BRIDGE.md</code> for dry-run, retries, and
          vendor-neutral examples.
        </p>
      </Card>
    </div>
  );
}
