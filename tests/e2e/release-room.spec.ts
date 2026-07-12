import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const accessKey = process.env.RELEASE_ROOM_ACCESS_KEY ?? "release-room-private";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[name="accessKey"]', accessKey);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

test("founder understands the blocker immediately", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: /Ship quickly/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Team billing settings" }),
  ).toBeVisible();
  await expect(page.getByText("Blocked from release")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Action queue" })).toBeVisible();
  await expect(page.getByText("Connections")).toBeVisible();
});

test("live dashboard can pause, resume, and refresh", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText(/Updated/)).toBeVisible();
});

test("release room exposes missing proof", async ({ page }) => {
  await login(page);
  await page.goto("/releases/team-billing-settings");
  await expect(page.getByText("Mobile visual review")).toBeVisible();
  await expect(
    page.getByText("Payment recovery alert clips at 390px width."),
  ).toBeVisible();
  await expect(page.getByText("Founder approval")).toBeVisible();
});

test("integration setup explains truthful states and live endpoints", async ({
  page,
}) => {
  await login(page);
  await page.goto("/integrations");
  await expect(
    page.getByRole("heading", { name: /Know what is configured/i }),
  ).toBeVisible();
  await expect(page.getByText("Editor & agent bridge")).toBeVisible();
  await expect(page.getByText("/api/webhooks/github")).toBeVisible();
  await expect(page.getByText("Configured").first()).toBeVisible();
  await expect(page.getByText("Connected").first()).toBeVisible();
});

test("recording route demonstrates blocked-to-ready workflow", async (
  { page },
  testInfo,
) => {
  test.skip(
    testInfo.project.name === "mobile",
    "The marketing capture route is intentionally fixed at 16:9.",
  );
  await page.goto("/record/release-room");
  await expect(page.getByText("Is the feature actually ready?")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Team billing settings" }),
  ).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("heading", { name: "Mobile failed-payment recovery" }),
  ).toBeVisible({ timeout: 7_000 });
  await expect(page.getByText("Evidence saved")).toBeVisible({
    timeout: 12_000,
  });
  await expect(page.getByText("Public build · private beta")).toBeVisible({
    timeout: 15_000,
  });
});

test("dashboard has no critical or serious automated accessibility violations", async ({
  page,
}) => {
  await login(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    ),
  ).toEqual([]);
});
