import { notFound } from "next/navigation";
import { getRelease } from "@/lib/db";
import { ReleaseDetail } from "@/components/release-detail";
export const dynamic = "force-dynamic";
export default async function ReleasePage({ params }: { params: Promise<{slug:string}> }) { const {slug}=await params; const release=await getRelease(slug); if(!release)notFound(); return <ReleaseDetail release={release}/>; }
