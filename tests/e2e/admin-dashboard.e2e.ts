import { expect, test } from "@playwright/test"
import type { Page, Route } from "@playwright/test"

const ADMIN_USER_ID = "admin-dashboard-test"
const APP_HOST = "127.0.0.1:4173"
const HOUR_MS = 60 * 60 * 1000

// 14 daily points: uploads in the thousands, failures in the tens, so the two
// measures only read when each gets its own chart.
const DAILY_POINTS = Array.from({ length: 14 }, (_, i) => {
  const uploads = 900 + ((i * 137) % 600)
  const failures = (i * 5) % 18
  return {
    time: new Date(Date.UTC(2026, 9, 20 + i)).toISOString(),
    registrations: 4 + ((i * 7) % 23),
    uploads,
    uploadSuccesses: uploads - failures,
    uploadFailures: failures,
  }
})

// 25 hourly buckets per 24-hour window. Last 24 h: 1,234 uploads, 14 failed,
// 25 sign-ups; the 24 h before: 1,000 uploads, 7 failed, 20 sign-ups.
function hourlyPoints(endMs: number, previous: boolean) {
  return Array.from({ length: 25 }, (_, i) => {
    const uploads = previous ? 40 : i === 24 ? 58 : 49
    const failures = previous ? (i < 7 ? 1 : 0) : i === 5 ? 14 : 0
    return {
      time: new Date(endMs - (24 - i) * HOUR_MS).toISOString(),
      registrations: previous ? (i < 20 ? 1 : 0) : 1,
      uploads,
      uploadSuccesses: uploads - failures,
      uploadFailures: failures,
    }
  })
}

// Field names as the backend sends them (adminstats/statistics_types.go):
// `{ key, count }` rows and `{ uploadMethod, dataType, count }` pairs.
const DASHBOARD = {
  generatedAt: "2026-11-09T00:00:00Z",
  users: { total: 51234, banned: 12, admin: 3, superAdmin: 1 },
  bindings: { total: 48000, verified: 46000, byServer: [{ key: "jp", count: 30000 }, { key: "cn", count: 12000 }, { key: "tw", count: 6000 }] },
  uploads: {
    windowHours: 24, windowStart: "2026-11-08T00:00:00Z", windowEnd: "2026-11-09T00:00:00Z",
    totalAllTime: 1_118_000, total: 1234, success: 1220, failed: 14,
    byMethod: [{ key: "inherit", count: 810 }, { key: "ios_script", count: 400 }, { key: "internal", count: 20 }, { key: "oauth2", count: 4 }],
    byDataType: [{ key: "suite", count: 700 }, { key: "mysekai", count: 400 }, { key: "mysekai_birthday_party", count: 134 }],
    byMethodAndDataType: [
      { uploadMethod: "inherit", dataType: "suite", count: 700 },
      { uploadMethod: "inherit", dataType: "mysekai", count: 110 },
      { uploadMethod: "ios_script", dataType: "mysekai", count: 290 },
      { uploadMethod: "ios_script", dataType: "mysekai_birthday_party", count: 110 },
      { uploadMethod: "internal", dataType: "mysekai_birthday_party", count: 20 },
      { uploadMethod: "oauth2", dataType: "mysekai_birthday_party", count: 4 },
    ],
  },
}

function analyticsMetrics(attemptCount: number, successCount: number, latencyP50Ms: number, latencyP95Ms: number) {
  return {
    attemptCount,
    successCount,
    failureCount: attemptCount - successCount,
    successRate: successCount / attemptCount,
    activeGameAccounts: Math.round(attemptCount / 2),
    latencySampleCount: attemptCount,
    latencyP50Ms,
    latencyP95Ms,
    metadataCount: 0,
    metadataCoverage: 0,
  }
}

// JSON names of `uploadAnalyticsResponse` (adminstats/upload_analytics.go).
const ANALYTICS = {
  from: "2026-11-08T00:00:00Z",
  to: "2026-11-09T00:00:00Z",
  groupBy: ["upload_method"],
  summary: analyticsMetrics(1234, 1220, 182.4, 1240.8),
  groups: [
    { dimensions: { upload_method: "inherit" }, ...analyticsMetrics(810, 804, 96, 310) },
    { dimensions: { upload_method: "ios_script" }, ...analyticsMetrics(400, 392, 210.8, 1480.2) },
  ],
  byFailureStage: { decode_payload: 9, persist: 4, retrieve_suite: 1 },
  migration: { v2Success: 30, v3Success: 90, unknownProtocolSuccess: 0, v3Share: 0.75, v2OnlyAccounts: 12 },
}

interface MockOptions {
  theme?: "light" | "dark"
  /** Answers the upload analytics request with a 500. */
  failAnalytics?: boolean
  /** Receives the query of every timeseries request. */
  onTimeseries?: (params: URLSearchParams) => void
}

async function mockDashboard(page: Page, { theme = "light", failAnalytics = false, onTimeseries }: MockOptions = {}) {
  await page.addInitScript(({ userId, theme }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Super admin",
      userId,
      role: "super_admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme }))
  }, { userId: ADMIN_USER_ID, theme })
  await page.route("**/*", (route: Route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) return route.continue()
    const ok = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", updatedData }),
    })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) return ok({})
    if (url.pathname === "/api/admin/statistics/dashboard") return ok(DASHBOARD)
    if (url.pathname === "/api/admin/statistics/timeseries") {
      onTimeseries?.(url.searchParams)
      const bucket = url.searchParams.get("bucket")
      const to = Date.parse(url.searchParams.get("to") ?? "")
      const points = bucket === "hour" ? hourlyPoints(to, Date.now() - to > HOUR_MS) : DAILY_POINTS
      return ok({ generatedAt: DASHBOARD.generatedAt, from: url.searchParams.get("from"), to: url.searchParams.get("to"), bucket, points })
    }
    if (url.pathname === "/api/admin/statistics/upload-analytics") {
      if (failAnalytics) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: 500, message: "failed to aggregate uploads" }),
        })
      }
      return ok(ANALYTICS)
    }
    return route.abort()
  })
}

/** Tick labels of one chart, joined with "|" and without separators or spaces. */
async function axisText(page: Page, testId: string) {
  const text = await page.getByTestId(testId).evaluate((node) =>
    Array.from(node.querySelectorAll("text")).map((el) => el.textContent).join("|"))
  return `|${text.replace(/[\s,]/g, "")}|`
}

for (const theme of ["light", "dark"] as const) {
  test(`dashboard shows the figures, a chart per measure and the 24-hour panels (${theme})`, async ({ page }) => {
    await mockDashboard(page, { theme })
    await page.goto("/admin/dashboard")

    const uploadChart = page.getByTestId("statistics-upload-trend")
    const failureChart = page.getByTestId("statistics-failure-trend")
    const registrationChart = page.getByTestId("statistics-registration-trend")
    await expect(uploadChart).toBeVisible()
    await expect(failureChart).toBeVisible()
    await expect(registrationChart).toBeVisible()

    const shotDir = process.env.E2E_SHOT_DIR
    if (shotDir) {
      await page.screenshot({ path: `${shotDir}/dashboard-${theme}.png`, fullPage: true })
    }

    // Uploads (up to 1,481) and failures (up to 17) differ by two orders of
    // magnitude: each has its own chart and its own integer axis instead of
    // two y scales over one plot.
    await expect(page.getByTestId("statistics-upload-right-axis")).toHaveCount(0)
    await expect.poll(() => axisText(page, "statistics-upload-trend")).toContain("|1600|")
    await expect.poll(() => axisText(page, "statistics-failure-trend")).toContain("|20|")
    expect(await axisText(page, "statistics-failure-trend")).not.toContain("|1600|")

    // Figures: totals from the dashboard payload, the change against the
    // previous 24 hours from the hourly timeseries (1,234 vs 1,000 uploads).
    const kpis = page.getByTestId("statistics-kpis")
    await expect(kpis.getByText("51,234")).toBeVisible()
    await expect(kpis.getByText("1,118,000")).toBeVisible()
    await expect(kpis.getByText("已验证 46,000 · 95.8%")).toBeVisible()
    await expect(kpis.getByText("+23.4%")).toBeVisible()
    await expect(kpis.getByText("失败率 1.13%")).toBeVisible()

    // The hourly panel sums the same window: 1,220 of 1,234 succeeded.
    await expect(page.getByTestId("statistics-hourly-chart")).toBeVisible()
    await expect(page.getByText("98.87%")).toBeVisible()

    // The breakdowns read the backend's `{ key, count }` rows and label the
    // logged-only method and data type values.
    await expect(page.getByText(/内部上传|Internal upload/).first()).toBeVisible()
    await expect(page.getByText(/MySekai 生日派对|MySekai Birthday Party/).first()).toBeVisible()
    await expect(page.getByText("30,000 · 62.5%")).toBeVisible()

    // Method × data type: the pairs, the row totals and the grand total.
    const matrix = page.getByTestId("statistics-method-matrix")
    await expect(matrix.getByRole("row", { name: /引继码/ })).toContainText("700")
    await expect(matrix.getByRole("row", { name: /引继码/ })).toContainText("810")
    await expect(matrix.locator("tfoot")).toContainText("1,234")

    // Upload analytics: processing time, failure stages, per-method rows.
    const quality = page.getByTestId("statistics-upload-quality")
    await expect(quality.getByText("1.24 s")).toBeVisible()
    await expect(quality.getByText("75.0%")).toBeVisible()
    await expect(quality.getByRole("row", { name: /iOS/ })).toContainText("98.00%")
    await expect(page.getByText("解析数据")).toBeVisible()
    await expect(page.getByText("9 · 64.3%")).toBeVisible()

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  })
}

test("dashboard range stays within the 30 days the backend accepts and reloads the trend", async ({ page }) => {
  const requests: Array<{ bucket: string | null; days: number }> = []
  await mockDashboard(page, {
    onTimeseries: (params) => {
      const span = Date.parse(params.get("to") ?? "") - Date.parse(params.get("from") ?? "")
      requests.push({ bucket: params.get("bucket"), days: span / (24 * HOUR_MS) })
    },
  })
  await page.goto("/admin/dashboard")
  await expect(page.getByTestId("statistics-upload-trend")).toBeVisible()
  expect(requests.filter((request) => request.bucket === "day").map((request) => request.days)).toEqual([30])
  // Two adjacent 24-hour windows feed the "against the previous 24 hours" figures.
  expect(requests.filter((request) => request.bucket === "hour").map((request) => request.days)).toEqual([1, 1])

  await page.getByRole("combobox", { name: "时间范围" }).click()
  await expect(page.getByRole("option")).toHaveText(["近 7 天", "近 14 天", "近 30 天"])
  await page.getByRole("option", { name: "近 7 天" }).click()
  await expect.poll(() => requests.filter((request) => request.bucket === "day").map((request) => request.days)).toEqual([30, 7])
  await expect(page.getByTestId("statistics-upload-trend")).toBeVisible()
})

test("dashboard keeps its figures and charts when the upload analytics request fails", async ({ page }) => {
  await mockDashboard(page, { failAnalytics: true })
  await page.goto("/admin/dashboard")

  await expect(page.getByText("加载上传质量失败")).toBeVisible()
  await expect(page.getByTestId("statistics-kpis").getByText("51,234")).toBeVisible()
  await expect(page.getByTestId("statistics-upload-trend")).toBeVisible()
  await expect(page.getByTestId("statistics-method-matrix")).toBeVisible()
  // The failure-stage list has nothing to count; the error is reported once.
  await expect(page.getByText("失败阶段")).toHaveCount(0)
  await expect(page.getByRole("alert")).toHaveCount(1)
})
