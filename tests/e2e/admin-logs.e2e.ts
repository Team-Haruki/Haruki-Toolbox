import { expect, test } from "@playwright/test"
import type { Page, Route } from "@playwright/test"

const ADMIN_USER_ID = "admin-logs-test"
const APP_HOST = "127.0.0.1:4173"
const WINDOW = { from: "2026-11-09T06:00:00Z", to: "2026-11-10T06:00:00Z" }

// Twenty system logs: every fourth one failed, one with a long action and path.
const SYSTEM_ROWS = Array.from({ length: 20 }, (_, index) => ({
  id: 9000 - index,
  eventTime: new Date(Date.parse("2026-11-10T05:59:00Z") - index * 60_000).toISOString(),
  actorType: index % 5 === 0 ? "system" : "admin",
  ...(index % 5 === 0 ? {} : { actorUserId: index % 2 ? "8800000001" : "8800000002", actorRole: "admin" }),
  action: index === 1 ? "user.oauth.authorization.revoke.with.a.very.long.action.name" : "admin.user.ban",
  targetType: "user",
  targetId: `77${index}`,
  result: index % 4 === 3 ? "failure" : "success",
  method: "POST",
  path: index === 1
    ? "/api/admin/users/7701/oauth2/authorizations/a-client-with-a-rather-long-identifier-that-must-wrap"
    : `/api/admin/users/77${index}/ban`,
  requestId: `req-${index}`,
  metadata: index % 4 === 3 ? { reason: "permission_denied" } : { note: "ok" },
}))

const SYSTEM_SUMMARY = {
  generatedAt: WINDOW.to,
  ...WINDOW,
  total: 1843,
  success: 1701,
  failure: 142,
  byAction: [
    { key: "user.login", count: 900 },
    { key: "admin.user.ban", count: 500 },
    { key: "a.third", count: 200 },
    { key: "a.fourth", count: 100 },
    { key: "a.fifth", count: 80 },
    { key: "a.sixth", count: 40 },
    { key: "a.seventh", count: 20 },
    { key: "an.eighth", count: 3 },
  ],
  byActorType: [{ key: "user", count: 1500 }, { key: "admin", count: 300 }, { key: "system", count: 43 }],
  byResult: [{ key: "success", count: 1701 }, { key: "failure", count: 142 }],
  byReason: [{ key: "permission_denied", count: 100 }, { key: "unknown", count: 42 }],
}

const UPLOAD_ROWS = Array.from({ length: 20 }, (_, index) => ({
  id: 5000 - index,
  server: index % 2 ? "cn" : "jp",
  gameUserId: `70123456789012${String(index).padStart(2, "0")}`,
  toolboxUserId: "8800000001",
  userName: index === 2 ? "A display name long enough that it has to wrap inside its column" : "Kanade",
  actorUserId: "8800000001",
  authorizationSource: "owner",
  authMethod: "browser_session",
  dataType: "suite",
  uploadMethod: "haruki_proxy",
  success: index !== 3,
  ...(index === 3
    ? { failureStage: "decode", errorCode: "INVALID_PAYLOAD", errorMessage: "msgpack: invalid code=c1 decoding map length" }
    : {}),
  processingDurationMs: 200 + index * 40,
  requestBytes: 300_000,
  uploadTime: new Date(Date.parse("2026-11-10T05:59:00Z") - index * 60_000).toISOString(),
}))

const UPLOAD_LIST = {
  generatedAt: WINDOW.to,
  ...WINDOW,
  page: 1,
  pageSize: 20,
  total: 12480,
  totalPages: 624,
  hasMore: true,
  sort: "upload_time_desc",
  filters: {},
  summary: {
    success: 12113,
    failed: 367,
    byMethod: [{ key: "haruki_proxy", count: 9000 }, { key: "inherit", count: 3480 }],
    byDataType: [{ key: "suite", count: 8000 }, { key: "mysekai", count: 4480 }],
  },
  items: UPLOAD_ROWS,
}

// One group per server and hour; hours without uploads are simply absent.
const UPLOAD_ANALYTICS = {
  ...WINDOW,
  groupBy: ["server"],
  interval: "hour",
  summary: {
    attemptCount: 12480, successCount: 12113, failureCount: 367, successRate: 0.9706,
    activeGameAccounts: 4312, latencySampleCount: 11890, latencyP50Ms: 642, latencyP95Ms: 2184,
    metadataCount: 9800, metadataCoverage: 0.785,
  },
  groups: Array.from({ length: 12 }, (_, hour) => [
    { dimensions: { server: "jp", bucket: `2026-11-09T${String(6 + hour).padStart(2, "0")}:00:00Z` }, attemptCount: 600 + hour * 10, successCount: 590 + hour * 10, failureCount: 10 },
    { dimensions: { server: "cn", bucket: `2026-11-09T${String(6 + hour).padStart(2, "0")}:00:00Z` }, attemptCount: 300, successCount: 295, failureCount: 5 },
  ]).flat(),
  byFailureStage: { decode: 300, unknown: 67 },
}

type MockOptions = {
  theme?: "light" | "dark"
  analyticsFails?: boolean
  empty?: boolean
}

/** Signs in as a super admin and answers the log APIs; returns the requests the page made, by path. */
async function mockLogs(page: Page, options: MockOptions = {}) {
  const requests: URL[] = []
  await page.addInitScript(({ userId, theme }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Super admin",
      userId,
      role: "super_admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme }))
  }, { userId: ADMIN_USER_ID, theme: options.theme ?? "light" })
  await page.route("**/*", (route: Route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) return route.continue()
    const ok = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", updatedData }),
    })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) return ok({})
    requests.push(url)
    if (url.pathname === "/api/admin/system-logs") {
      const items = options.empty ? [] : SYSTEM_ROWS
      return ok({
        generatedAt: WINDOW.to, ...WINDOW, page: 1, pageSize: 20,
        total: options.empty ? 0 : 1843, totalPages: options.empty ? 0 : 93, hasMore: !options.empty,
        sort: "event_time_desc", filters: {}, items,
      })
    }
    if (url.pathname === "/api/admin/system-logs/summary") {
      return ok(options.empty
        ? { ...SYSTEM_SUMMARY, total: 0, success: 0, failure: 0, byAction: [], byActorType: [], byResult: [], byReason: [] }
        : SYSTEM_SUMMARY)
    }
    if (url.pathname.startsWith("/api/admin/system-logs/")) {
      return ok(SYSTEM_ROWS.find((row) => String(row.id) === url.pathname.split("/").pop()) ?? SYSTEM_ROWS[0])
    }
    if (url.pathname === "/api/admin/statistics/upload-logs") return ok(UPLOAD_LIST)
    if (url.pathname === "/api/admin/statistics/upload-analytics") {
      if (options.analyticsFails) {
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: 500, message: "statistics unavailable" }) })
      }
      return ok(UPLOAD_ANALYTICS)
    }
    return route.abort()
  })
  return requests
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
}

test("system logs: figures for the whole range, breakdowns, and a dense table whose rows open the detail", async ({ page }) => {
  await mockLogs(page)
  await page.goto("/admin/logs")

  const summary = page.getByTestId("system-logs-summary")
  // The tiles come from the summary endpoint, not from the 20 rows of the page.
  await expect(summary.getByText("1,843", { exact: true })).toBeVisible()
  await expect(summary.getByText("1,701", { exact: true })).toBeVisible()
  await expect(summary.getByText("142", { exact: true })).toBeVisible()
  await expect(summary.getByText("92.3%", { exact: true })).toBeVisible()
  await expect(page.getByTestId("system-logs-scope")).toContainText("符合筛选条件的全部日志")

  // Top six actions, the two beyond them folded into a note instead of dropped.
  await expect(summary.getByText("user.login")).toBeVisible()
  await expect(summary.getByText("900 · 49%")).toBeVisible()
  await expect(summary.getByText("an.eighth")).toHaveCount(0)
  await expect(summary.getByText("另有 2 项，共 23 条")).toBeVisible()
  // A failed log without a recorded reason is labelled, not shown as the raw "unknown".
  await expect(summary.getByText("未记录原因")).toBeVisible()
  // The per-page panel says it only covers the rows shown.
  await expect(page.getByTestId("system-logs-page-actors")).toContainText("只统计下方表格显示的 20 条")
  await expect(page.getByTestId("system-logs-page-actors")).toContainText("8 · 40%")

  const rows = page.getByTestId("system-log-row")
  await expect(rows).toHaveCount(20)
  await expect(rows.nth(3).locator("[data-slot=logs-result-chip]")).toHaveAttribute("data-result", "failure")
  await expect(rows.first()).toContainText("admin.user.ban")
  await expect(rows.first()).toContainText("user:770")
  await expectNoHorizontalOverflow(page)

  // A row opens its detail, with the metadata the backend sends.
  await rows.nth(3).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("日志详情")).toBeVisible()
  await expect(dialog.getByText("permission_denied")).toBeVisible()
  await expect(dialog.getByText("req-3")).toBeVisible()
})

test("system logs: the filters are sent the way the backend reads them, to the list and the summary", async ({ page }) => {
  const requests = await mockLogs(page)
  await page.goto("/admin/logs")
  await expect(page.getByTestId("system-log-row")).toHaveCount(20)

  // The default view names no filter at all: the backend then covers the last 24 hours.
  const first = requests.find((url) => url.pathname === "/api/admin/system-logs")!
  expect(first.searchParams.get("page_size")).toBe("20")
  expect(first.searchParams.has("action")).toBe(false)
  expect(first.searchParams.has("from")).toBe(false)

  requests.length = 0
  await page.getByPlaceholder("按操作名搜索…").fill("user.ban")
  await page.getByPlaceholder("按操作名搜索…").press("Enter")
  await page.getByTestId("system-logs-toolbar").getByRole("button", { name: "失败", exact: true }).click()
  await expect.poll(() => requests.some((url) =>
    url.pathname === "/api/admin/system-logs/summary"
    && url.searchParams.get("action") === "user.ban"
    && url.searchParams.get("result") === "failure")).toBe(true)
  expect(requests.some((url) =>
    url.pathname === "/api/admin/system-logs"
    && url.searchParams.get("action") === "user.ban"
    && url.searchParams.get("result") === "failure")).toBe(true)
  await expect(page).toHaveURL(/q=user\.ban/)
  await expect(page).toHaveURL(/result=failure/)
})

test("system logs: an empty range says so and drops the breakdowns", async ({ page }) => {
  await mockLogs(page, { empty: true })
  await page.goto("/admin/logs?q=nothing")

  await expect(page.getByText("暂无日志")).toBeVisible()
  await expect(page.getByText("没有符合筛选条件的日志")).toBeVisible()
  await expect(page.getByTestId("system-logs-breakdowns")).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

test("upload logs: counts, breakdowns and volume for the whole range, with failed rows carrying their error", async ({ page }) => {
  const requests = await mockLogs(page, { theme: "dark" })
  await page.goto("/admin/upload-logs")

  const summary = page.getByTestId("upload-logs-summary")
  await expect(summary.getByText("12,480", { exact: true })).toBeVisible()
  await expect(summary.getByText("367", { exact: true })).toBeVisible()
  await expect(summary.getByText("97.1%", { exact: true })).toBeVisible()
  await expect(summary.getByText("4,312", { exact: true })).toBeVisible()
  await expect(summary.getByText("642 ms", { exact: true })).toBeVisible()
  await expect(page.getByTestId("upload-logs-scope")).toContainText("符合筛选条件的全部上传")
  // The hourly series fills the hours the backend left out, so it spans the whole range.
  await expect(summary.getByRole("img", { name: "每小时上传量走势" })).toBeVisible()

  // Per-server split and failure stages come from the analytics groups.
  const byServer = page.getByTestId("upload-logs-by-server")
  await expect(byServer).toContainText("日服")
  await expect(byServer).toContainText("7,860 · 69%")
  await expect(page.getByTestId("upload-logs-failure-stages")).toContainText("未记录阶段")

  const analytics = requests.find((url) => url.pathname === "/api/admin/statistics/upload-analytics")!
  expect(analytics.searchParams.get("group_by")).toBe("server")
  expect(analytics.searchParams.get("interval")).toBe("hour")

  const rows = page.getByTestId("upload-log-row")
  await expect(rows).toHaveCount(20)
  await expect(rows.nth(3).getByTestId("upload-log-row-error")).toContainText("INVALID_PAYLOAD · decode: msgpack")
  await expectNoHorizontalOverflow(page)

  await rows.nth(3).getByRole("button", { name: "查看详情" }).click()
  await expect(page.getByRole("dialog").getByText("上传失败详情")).toBeVisible()
})

test("upload logs: a failed analytics request leaves the list and its own counts in place", async ({ page }) => {
  await mockLogs(page, { analyticsFails: true })
  await page.goto("/admin/upload-logs")

  await expect(page.getByTestId("upload-log-row")).toHaveCount(20)
  await expect(page.getByTestId("upload-logs-summary").getByText("12,480", { exact: true })).toBeVisible()
  await expect(page.getByTestId("upload-logs-by-server").getByRole("button", { name: "重试" })).toBeVisible({ timeout: 15_000 })
})

test("log pages fold their rows instead of scrolling sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockLogs(page)

  await page.goto("/admin/logs")
  await expect(page.getByTestId("system-log-row")).toHaveCount(20)
  await expectNoHorizontalOverflow(page)

  await page.goto("/admin/upload-logs")
  await expect(page.getByTestId("upload-log-row")).toHaveCount(20)
  // The filter panel starts folded on a phone so the logs stay on the first screens.
  await expect(page.locator("#upload-log-filter-method")).toHaveCount(0)
  await page.getByRole("button", { name: /筛选条件/ }).click()
  await expect(page.locator("#upload-log-filter-method")).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
