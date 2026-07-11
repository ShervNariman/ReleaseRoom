"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Cable, CircleDotDashed, Rocket, ShieldCheck } from "lucide-react";

const links = [
  ["Now", "/", CircleDotDashed], ["Releases", "/releases", Rocket], ["Policies", "/policies", ShieldCheck], ["Integrations", "/integrations", Cable], ["Activity", "/activity", Activity],
] as const;

export function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  if (mobile) return <div className="flex min-w-0 gap-1 overflow-x-auto">{links.slice(0,4).map(([label,href]) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-semibold ${active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</Link>; })}</div>;
  return <nav className="space-y-1" aria-label="Primary navigation">{links.map(([label,href,Icon]) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><Icon className="size-4"/>{label}</Link>; })}</nav>;
}
