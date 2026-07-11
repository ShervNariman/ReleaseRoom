import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { EvidenceStatus, ReleaseDecision, RiskLevel } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(" "); }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]", className)}>{children}</section>; }
export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "red" | "green" | "amber" | "purple" }) { const tones = { slate: "bg-slate-100 text-slate-700", red: "bg-red-50 text-red-700 ring-red-200", green: "bg-emerald-50 text-emerald-700 ring-emerald-200", amber: "bg-amber-50 text-amber-800 ring-amber-200", purple: "bg-violet-50 text-violet-700 ring-violet-200" }; return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone])}>{children}</span>; }
export function StatusIcon({ status, className = "size-4" }: { status: EvidenceStatus; className?: string }) { if (status === "passed") return <CheckCircle2 className={cn(className, "text-emerald-600")} aria-hidden />; if (status === "failed") return <XCircle className={cn(className, "text-red-600")} aria-hidden />; if (status === "warning") return <AlertTriangle className={cn(className, "text-amber-600")} aria-hidden />; return <CircleDashed className={cn(className, "text-slate-500")} aria-hidden />; }
export function decisionTone(decision: ReleaseDecision) { return decision === "ready" ? "green" : decision === "needs_attention" ? "amber" : "red"; }
export function riskTone(risk: RiskLevel) { return risk === "critical" ? "red" : risk === "high" ? "amber" : risk === "medium" ? "purple" : "green"; }
