#!/usr/bin/env node
import { createHmac, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const commands = new Set(["start", "complete", "fail", "report"]);
const argv = process.argv.slice(2);
const command = argv[0];
if (!commands.has(command)) {
  console.error("Usage: release-room <start|complete|fail|report> --release <slug> [options]");
  process.exit(2);
}

function argsToObject(values) {
  const result = {};
  for (let i = 1; i < values.length; i += 1) {
    const current = values[i];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = values[i + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else { result[key] = next; i += 1; }
  }
  return result;
}

const args = argsToObject(argv);
const releaseSlug = args.release || process.env.RELEASE_ROOM_RELEASE;
if (!releaseSlug) { console.error("Missing --release or RELEASE_ROOM_RELEASE"); process.exit(2); }

const endpoint = args.url || process.env.RELEASE_ROOM_URL || "http://localhost:3000/api/evidence";
const secret = process.env.RELEASE_ROOM_WEBHOOK_SECRET;
const editor = args.editor || process.env.RELEASE_ROOM_EDITOR || "Cursor";
const model = args.model || process.env.RELEASE_ROOM_MODEL || "Unspecified model";
const task = args.task || process.env.RELEASE_ROOM_TASK || "Unlinked task";
const runId = args["run-id"] || process.env.RELEASE_ROOM_RUN_ID || randomUUID();
const status = command === "start" ? "pending" : command === "fail" ? "failed" : command === "complete" ? "passed" : (args.status || "warning");
const checks = String(args.checks || "").split(",").map((value) => value.trim()).filter(Boolean);
const filesChanged = Number(args.files || 0);
const elapsedMinutes = Number(args.minutes || 0);
const cost = args.cost ? Number(args.cost) : undefined;
const outcome = String(args.outcome || (command === "start" ? "Agent work started." : command === "complete" ? "Agent work completed and reported." : command === "fail" ? "Agent work failed or was rejected." : "Agent work evidence reported."));

const metadata = { editor: String(editor).slice(0, 100), model: String(model).slice(0, 120), task: String(task).slice(0, 120), command, branch: String(args.branch || process.env.GIT_BRANCH || "").slice(0, 200), commit: String(args.commit || process.env.GIT_COMMIT || "").slice(0, 80), filesChanged, elapsedMinutes, ...(cost === undefined || Number.isNaN(cost) ? {} : { cost }) };
const detailParts = [outcome, `${editor} · ${model}`, `Task ${task}`];
if (checks.length) detailParts.push(`Checks: ${checks.join(", ")}`);
if (filesChanged) detailParts.push(`${filesChanged} files changed`);
if (elapsedMinutes) detailParts.push(`${elapsedMinutes} min`);

const payload = { eventId: `${runId}:${command}`, releaseSlug, actor: String(editor).slice(0, 100), eventType: `editor.${command}`, metadata, evidence: { key: `editor-run:${runId}`, category: "engineering", label: `${editor} run · ${task}`.slice(0, 150), description: detailParts.join(" · ").slice(0, 1500), status, required: false, source: "Editor bridge", owner: String(editor).slice(0, 100) } };
const body = JSON.stringify(payload);
if (args.output) await writeFile(String(args.output), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
if (args["dry-run"] || args.offline) { console.log(JSON.stringify(payload, null, 2)); process.exit(0); }
if (!secret) { console.error("Missing RELEASE_ROOM_WEBHOOK_SECRET. Use --dry-run for offline output."); process.exit(2); }
const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
let response;
for (let attempt = 1; attempt <= 3; attempt += 1) { try { response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-release-room-signature": signature }, body, signal: AbortSignal.timeout(10_000) }); if (response.ok || response.status < 500) break; } catch (error) { if (attempt === 3) throw error; } await new Promise((resolve) => setTimeout(resolve, attempt * 500)); }
const text = await response.text();
if (!response.ok) { console.error(`Release Room rejected the report (${response.status}): ${text}`); process.exit(1); }
console.log(text || JSON.stringify({ ok: true }));
