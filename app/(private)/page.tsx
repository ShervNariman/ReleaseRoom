import { LiveCommandCenter } from "@/components/live-command-center";
import { getDashboardSnapshot } from "@/lib/dashboard";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export default async function Home() {
  return <LiveCommandCenter initial={await getDashboardSnapshot()} intervalMs={env.RELEASE_ROOM_LIVE_INTERVAL_MS}/>;
}
