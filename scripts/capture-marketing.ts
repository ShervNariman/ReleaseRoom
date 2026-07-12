import { chromium as playwright } from "@playwright/test";
import chromium from "@sparticuz/chromium";
import { mkdir } from "node:fs/promises";

const output = "marketing/screenshots";
await mkdir(output, { recursive: true });

const browser = await playwright.launch({
  executablePath: await chromium.executablePath(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

await page.goto("http://127.0.0.1:3100/login", { waitUntil: "networkidle" });
await page.fill(
  'input[name="accessKey"]',
  process.env.RELEASE_ROOM_ACCESS_KEY ?? "release-room-private",
);
await page.click('button[type="submit"]');
await page.waitForURL("http://127.0.0.1:3100/");
await page.screenshot({
  path: `${output}/release-room-founder-dashboard.png`,
  fullPage: false,
  animations: "disabled",
  caret: "hide",
});

await page.goto(
  "http://127.0.0.1:3100/releases/team-billing-settings",
  { waitUntil: "networkidle" },
);
await page.screenshot({
  path: `${output}/release-room-evidence-room.png`,
  fullPage: false,
  animations: "disabled",
  caret: "hide",
});

await browser.close();
console.log(`Captured approved 1920x1080 screenshots in ${output}`);
