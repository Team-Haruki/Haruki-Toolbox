import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const ADMIN_USER_ID = "admin-dashboard-test"
const APP_HOST = "127.0.0.1:4173"

// 14 daily points: uploads in the thousands, failures in the tens, so the two
// measures only read together when failures get their own axis.
const POINTS = Array.from({ length: 14 }, (_, i) => {
  const uploads = 900 + ((i * 137) % 600)
  const failures = (i * 5) % 18
  return {
    time: `2026-10-${String(20 + i).padStart(2, "0")}T00:00:00Z`.replace("2026-10-32", "2026-11-01").replace("2026-10-33", "2026-11-02"),
    registrations: 4 + ((i * 7) % 23),
    uploads,
    uploadSuccesses: uploads - failures,
    uploadFailures: failures,
  }
})

async function mockDashboard(page: Page, theme: "light" | "dark") {
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
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) return route.continue()
    const ok = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", updatedData }),
    })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) return ok({})
    if (url.pathname === "/api/admin/statistics/dashboard") {
      return ok({
        generatedAt: "2026-11-09T00:00:00Z",
        users: { total: 51234, banned: 12, admin: 3, superAdmin: 1 },
        bindings: { total: 48000, verified: 46000, byServer: [{ server: "jp", count: 30000 }, { server: "cn", count: 12000 }, { server: "tw", count: 6000 }] },
        uploads: {
          windowHours: 24, windowStart: "2026-11-08T00:00:00Z", windowEnd: "2026-11-09T00:00:00Z",
          totalAllTime: 1_118_000, total: 1234, success: 1220, failed: 14,
          byMethod: [{ method: "inherit", count: 500 }, { method: "ios_script", count: 400 }, { method: "internal", count: 20 }, { method: "oauth2", count: 4 }],
          byDataType: [{ dataType: "suite", count: 700 }, { dataType: "mysekai", count: 400 }, { dataType: "mysekai_birthday_party", count: 134 }],
          byMethodAndDataType: [],
        },
      })
    }
    if (url.pathname === "/api/admin/statistics/timeseries") {
      return ok({ generatedAt: "2026-11-09T00:00:00Z", from: POINTS[0]!.time, to: POINTS.at(-1)!.time, bucket: "day", points: POINTS })
    }
    return route.abort()
  })
}

for (const theme of ["light", "dark"] as const) {
  test(`dashboard splits the trend into an upload chart with paired axes and a registration chart (${theme})`, async ({ page }) => {
    await mockDashboard(page, theme)
    await page.goto("/admin/dashboard")

    const uploadChart = page.getByTestId("statistics-upload-trend")
    const registrationChart = page.getByTestId("statistics-registration-trend")
    await expect(uploadChart).toBeVisible()
    await expect(registrationChart).toBeVisible()

    const shotDir = process.env.E2E_SHOT_DIR
    if (shotDir) {
      await page.screenshot({ path: `${shotDir}/dashboard-${theme}.png`, fullPage: true })
    }

    // Left axis counts uploads up to the nice maximum 2,000; the right axis
    // relabels the same tick positions as failures up to 20.
    const uploadAxisText = await uploadChart.evaluate((node) => Array.from(node.querySelectorAll("text")).map((el) => el.textContent).join("|"))
    expect(uploadAxisText.replace(/[\s,]/g, "")).toMatch(/\|2000\|/)
    await expect(page.getByTestId("statistics-upload-right-axis")).toHaveText(/^\s*0\s*5\s*10\s*15\s*20\s*$/)
    await expect(page.getByText(/上传次数（左轴）|Uploads \(left axis\)/)).toBeVisible()
    await expect(page.getByText(/上传失败次数（右轴）|Failed uploads \(right axis\)/)).toBeVisible()

    // The breakdown labels the logged-only method and data type values.
    await expect(page.getByText(/内部上传|Internal upload/)).toBeVisible()
    await expect(page.getByText(/MySekai 生日派对|MySekai Birthday Party/)).toBeVisible()

  })
}
