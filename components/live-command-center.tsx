"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, CirclePause, CirclePlay, CloudCog, RefreshCw, ShieldAlert, TimerReset } from "lucide-react";
import { ReleaseDashboard } from "@/components/release-dashboard";
import { Card, Pill } from "@/components/ui";
import { evaluateRelease } from "@/lib/decision";
import type { DashboardSnapshot, IntegrationHealth } from "@/lib/types";

function statusTone(status: IntegrationHealth["status"]) {
  return status === "connected" ? "green" : status === "fixture" ? "slate" : "amber";
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function LiveCommandCenter({ initial, intervalMs }: { initial: DashboardSnapshot; intervalMs: number }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(new Date(initial.generatedAt).getTime() + intervalMs);
  const [clock, setClock] = useState(new Date(initial.generatedAt).getTime());
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/snapshot", { cache: "no-store" });
      if (!response.ok) throw new Error(`Snapshot refresh failed (${response.status})`);
      const next = (await response.json()) as DashboardSnapshot;
      if (mounted.current) {
        setSnapshot(next);
        setError(null);
        setNextRefresh(Date.now() + intervalMs);
      }
    } catch (refreshError) {
      if (mounted.current) setError(refreshError instanceof Error ? refreshError.message : "Live refresh failed");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [intervalMs, loading]);

  useEffect(() => {
    mounted.current = true;
    if (paused) return () => { mounted.current = false; };
    const timer = window.setInterval(() => {
      setClock(Date.now());
      if (document.visibilityState === "visible") void refresh();
    }, intervalMs);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { mounted.current = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [intervalMs, paused, refresh]);

  const selected = useMemo(() => snapshot.releases.find((release) => evaluateRelease(release).decision === "blocked") ?? snapshot.releases[0], [snapshot.releases]);
  const stale = clock - new Date(snapshot.generatedAt).getTime() > intervalMs * 3;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${error || stale ? "bg-amber-500" : paused ? "bg-slate-400" : "animate-pulse bg-emerald-500"}`} /><p className="eyebrow">LIVE COMMAND CENTER</p></div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Ship quickly. Keep the final decision calm.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Release Room refreshes evidence and provider health automatically, then brings forward only the decisions that require a human.</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-slate-500">Updated {relativeTime(snapshot.generatedAt)}</span><button type="button" onClick={() => setPaused((value) => !value)} className="button-secondary" aria-label={paused ? "Resume live refresh" : "Pause live refresh"}>{paused ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}{paused ? "Resume" : "Pause"}</button><button type="button" onClick={() => void refresh()} disabled={loading} className="button-secondary"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    </div>

    {(error || stale) && <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4"><ShieldAlert className="mt-0.5 size-5 text-amber-700"/><div><p className="text-sm font-semibold text-amber-950">Live data may be stale</p><p className="mt-1 text-sm text-amber-800">{error ?? "No successful refresh has arrived within the expected window."}</p></div></Card>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Active candidates", value: snapshot.metrics.active, icon: Activity, detail: "Across the private workspace" }, { label: "Blocked", value: snapshot.metrics.blocked, icon: ShieldAlert, detail: "Need a human or missing proof" }, { label: "Required proof", value: `${snapshot.metrics.proofCompletion}%`, icon: CloudCog, detail: "Passed across active releases" }, { label: "Oldest open signal", value: `${snapshot.metrics.waitingMinutes}m`, icon: TimerReset, detail: `Next refresh ${paused ? "paused" : relativeTime(new Date(nextRefresh).toISOString())}` }].map(({label,value,icon:Icon,detail}) => <Card key={label} className="p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className="size-4 text-slate-400"/></div><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></Card>)}
    </div>

    <Card className="p-4"><div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Connections</span>{snapshot.integrations.map((integration) => <Link href="/integrations" key={integration.provider} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"><span className={`size-1.5 rounded-full ${integration.status === "connected" ? "bg-emerald-500" : integration.status === "fixture" ? "bg-slate-400" : "bg-amber-500"}`}/>{integration.name}<Pill tone={statusTone(integration.status)}>{integration.status}</Pill></Link>)}</div></Card>

    {selected ? <ReleaseDashboard release={selected}/> : <Card className="p-12 text-center"><p className="text-lg font-semibold">No active release candidates</p><p className="mt-2 text-sm text-slate-500">Create the first release room to begin collecting evidence.</p><Link href="/releases/new" className="button-primary mt-5 inline-flex">Create release</Link></Card>}

    <div className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
      <Card className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold text-slate-950">Live activity</h2><p className="mt-1 text-sm text-slate-500">Provider and editor events, newest first.</p></div><div className="divide-y divide-slate-100">{snapshot.events.length ? snapshot.events.slice(0,8).map((event) => <div key={event.id} className="flex gap-3 p-4"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${event.status === "processed" ? "bg-emerald-500" : event.status === "failed" ? "bg-red-500" : "bg-slate-400"}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{event.summary}</p><Pill>{event.provider}</Pill></div><p className="mt-1 text-xs text-slate-500">{event.eventType} · {relativeTime(event.receivedAt)}{event.releaseSlug ? ` · ${event.releaseSlug}` : ""}</p></div></div>) : <div className="p-8 text-center text-sm text-slate-500">No live events yet. Webhook and editor activity will appear here.</div>}</div></Card>
      <Card className="p-5"><h2 className="font-semibold text-slate-950">What v2 is listening for</h2><div className="mt-4 space-y-3">{["GitHub checks, reviews, pull requests, and pushes", "Linear issue changes and acceptance criteria", "Vercel deployment lifecycle events", "Cursor and coding-agent run evidence through the signed CLI"].map((item) => <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-3"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-violet-600"/><p className="text-sm leading-5 text-slate-700">{item}</p></div>)}</div><Link href="/integrations" className="mt-5 inline-flex text-sm font-semibold text-violet-700">Open integration setup →</Link></Card>
    </div>
  </div>;
}
