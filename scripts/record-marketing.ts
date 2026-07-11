import { chromium as playwright } from "@playwright/test";
import chromium from "@sparticuz/chromium";
import { mkdir, readdir, rename } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const rawDir = "marketing/video/raw";
await mkdir(rawDir, { recursive: true });
const tempDir = path.join(rawDir, "capture");
await mkdir(tempDir, { recursive: true });

const browser = await playwright.launch({
  executablePath: await chromium.executablePath(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: tempDir, size: { width: 1280, height: 720 } },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:3100/record/release-room", { waitUntil: "networkidle" });
await page.waitForTimeout(15500);
await page.close();
await context.close();
await browser.close();

const captures = (await readdir(tempDir)).filter((name) => name.endsWith(".webm"));
if (captures.length !== 1) throw new Error(`Expected one video capture, found ${captures.length}`);
const source = path.join(tempDir, captures[0]);
const webm = path.join(rawDir, "release-room-15s-demo.webm");
await rename(source, webm);

const mp4 = path.join(rawDir, "release-room-15s-demo.mp4");
const ffmpeg = spawnSync("ffmpeg", [
  "-y",
  "-i", webm,
  "-t", "15",
  "-vf", "scale=1920:1080:flags=lanczos,minterpolate=fps=60:mi_mode=blend,format=yuv420p",
  "-c:v", "libx264",
  "-preset", "fast",
  "-crf", "18",
  "-movflags", "+faststart",
  "-an",
  mp4,
], { stdio: "inherit" });
if (ffmpeg.status !== 0) process.exit(ffmpeg.status ?? 1);
console.log(`Recorded ${mp4} at 1920x1080 / 60 fps`);
