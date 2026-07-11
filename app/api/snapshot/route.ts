import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await hasSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getDashboardSnapshot(), { headers: { "Cache-Control": "private, no-store" } });
}
