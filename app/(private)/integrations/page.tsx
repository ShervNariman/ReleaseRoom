import { CheckCircle2, CircleDashed, Clock3, Radio, ShieldCheck, Wrench } from "lucide-react";
import { integrationHealth } from "@/lib/integrations/health";
import { Card, Pill } from "@/components/ui";

function tone(status: string) { return status === "connected" ? "green" : status === "fixture" ? "slate" : "amber"; }
function icon(status: string) { return status === "connected" ? CheckCircle2 : status === "fixture" ? CircleDashed : Wrench; }

export const dynamic = "force-dynamic";
export default async function IntegrationsPage() {
  const integrations = await integrationHealth();
  return <div className="space-y-7">
    <div><p className="eyebrow">INTEGRATIONS</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">A five-minute path to live release evidence.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Start with read-only backfill, then add signed webhooks for live updates. The editor bridge works across Cursor, Codex, Claude Code, and local scripts.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">{integrations.map((integration) => { const Icon = icon(integration.status); return <Card key={integration.provider} className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2"><Icon className="size-5 text-slate-700"/></div><div><h2 className="font-semibold text-slate-950">{integration.name}</h2><p className="text-xs text-slate-500">{integration.role}</p></div></div><Pill tone={tone(integration.status)}>{integration.status.replace("_"," ")}</Pill></div><p className="mt-4 text-sm leading-6 text-slate-600">{integration.description}</p><div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><span className="inline-flex items-center gap-2"><Clock3 className="size-3.5"/>Last event: {integration.lastEventAt ? new Date(integration.lastEventAt).toLocaleString() : "Not received"}</span><span className="inline-flex items-center gap-2"><Radio className="size-3.5"/>Freshness: {integration.freshness}</span><span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5"/>Permissions: {integration.permissions}</span></div>{integration.action && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">{integration.action}</p>}</Card>; })}</div>
    <Card className="p-5"><h2 className="font-semibold text-slate-950">Live endpoints</h2><div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2"><code className="rounded-xl bg-slate-950 p-3 text-xs text-slate-100">POST /api/integrations/github</code><code className="rounded-xl bg-slate-950 p-3 text-xs text-slate-100">POST /api/integrations/linear</code><code className="rounded-xl bg-slate-950 p-3 text-xs text-slate-100">POST /api/integrations/vercel</code><code className="rounded-xl bg-slate-950 p-3 text-xs text-slate-100">POST /api/evidence</code></div></Card>
  </div>;
}
