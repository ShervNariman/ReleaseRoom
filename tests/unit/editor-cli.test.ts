import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
describe("editor bridge CLI", () => { it("produces bounded vendor-neutral evidence in dry-run mode", async () => { const { stdout } = await exec(process.execPath, ["scripts/release-room-cli.mjs", "complete", "--release", "team-billing-settings", "--editor", "Cursor", "--model", "Grok 4.5 Very Fast", "--task", "SHE-71", "--checks", "lint,typecheck,test", "--dry-run"], { cwd: process.cwd() }); const payload = JSON.parse(stdout); expect(payload.eventType).toBe("editor.complete"); expect(payload.evidence.source).toBe("Editor bridge"); expect(payload.metadata.model).toBe("Grok 4.5 Very Fast"); expect(JSON.stringify(payload)).not.toContain("RELEASE_ROOM_WEBHOOK_SECRET"); }); });
