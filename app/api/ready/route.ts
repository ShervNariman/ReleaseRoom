import { NextResponse } from "next/server";
import { databaseReady } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ready = await databaseReady();
  return NextResponse.json(
    {
      status: ready ? "ready" : "unavailable",
      service: "release-room",
      check: "database",
      time: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
