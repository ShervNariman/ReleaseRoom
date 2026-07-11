import Link from "next/link";
import { Plus } from "lucide-react";
import { listReleases } from "@/lib/db";
import { ReleaseList } from "@/components/release-list";
export const dynamic = "force-dynamic";
export default async function ReleasesPage() { const releases=await listReleases(); return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">RELEASES</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Every release decision, searchable.</h1><p className="mt-3 text-sm text-slate-600">Active candidates, durable history, and exactly why each release moved or stopped.</p></div><Link href="/releases/new" className="button-primary"><Plus className="size-4"/>New release</Link></div><ReleaseList releases={releases}/></div>; }
