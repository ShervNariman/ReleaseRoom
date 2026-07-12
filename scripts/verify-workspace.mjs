import { execFileSync } from "node:child_process";
import { basename, resolve } from "node:path";

const expectedRepo = "https://github.com/ShervNariman/ReleaseRoom.git";
const root = resolve(process.cwd());
const folder = basename(root).toLowerCase();

function fail(message) {
  console.error(`\nRelease Room workspace check failed: ${message}\n`);
  process.exit(1);
}

if (folder !== "releaseroom" && folder !== "release-room") {
  fail(`expected workspace folder ReleaseRoom, received ${basename(root)}`);
}

let remote;
try {
  remote = execFileSync("git", ["remote", "get-url", "origin"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
} catch {
  fail("origin remote is missing");
}

const normalized = remote
  .replace(/^git@github\.com:/, "https://github.com/")
  .replace(/\/$/, "")
  .replace(/\.git$/, "");
const expected = expectedRepo.replace(/\.git$/, "");

if (normalized.toLowerCase() !== expected.toLowerCase()) {
  fail(`origin points to ${remote}; expected ${expectedRepo}`);
}

console.log(`Release Room workspace verified: ${root}`);
console.log(`Repository verified: ${expectedRepo}`);
