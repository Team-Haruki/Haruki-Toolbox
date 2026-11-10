import { expect, test, type Page } from "@playwright/test"

// The global game binding page against a mocked backend: the list answers
// like /api/admin/game-account-bindings (owner object, `verified`, the two
// sharing objects, `verified` / `server` as filters) and the site-wide counts
// come from `bindings` of /api/admin/statistics/dashboard.
const APP_HOST = "127.0.0.1:4173"
const LIST_PATH = "/api/admin/game-account-bindings"
const STATS_PATH = "/api/admin/statistics/dashboard"
const ADMIN_USER_ID = "bindings-admin"

type ApiCall = {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

function createBindings() {
  return [
    {
      id: 3,
      server: "jp",
      gameUserId: "7480000000000001",
      verified: true,
      suite: { allowPublicApi: true, allowSakura: true, allow8823: false, allowResona: false, allowLuna: false },
      mysekai: { allowPublicApi: false, allowFixtureApi: true, allow8823: false, allowResona: false, allowLuna: false },
      owner: { userId: "8532047001", name: "Seiun", email: "seiun@example.com", role: "admin" },
    },
    {
      id: 2,
      server: "cn",
      gameUserId: "7480000000000002",
      verified: false,
      suite: { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false },
      owner: { userId: "8532047002", name: `a-user-with-${"a-very-long-".repeat(12)}name`, email: "long@example.com", role: "user" },
    },
    {
      id: 1,
      server: "tw",
      gameUserId: "7480000000000003",
      verified: true,
      owner: { userId: "8532047003", name: "", email: "", role: "user" },
    },
  ]
}

async function openBindings(page: Page, options: { failingStats?: boolean } = {}) {
  const bindings = createBindings()
  const calls: ApiCall[] = []
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Admin",
      userId,
      role: "admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme: "light" }))
  }, ADMIN_USER_ID)
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    const reply = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "success", updatedData }),
    })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) {
      return reply({ userId: ADMIN_USER_ID, name: "Admin", role: "admin" })
    }
    if (url.pathname === "/api/admin/tickets") {
      return reply({ items: [], total: 0 })
    }
    const call: ApiCall = {
      method: request.method(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body: request.postDataJSON(),
    }
    calls.push(call)

    if (call.path === STATS_PATH) {
      if (options.failingStats) {
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: 500, message: "failed to query dashboard statistics" }) })
      }
      return reply({
        generatedAt: "2026-11-09T00:00:00Z",
        users: { total: 51234, banned: 12, admin: 3, superAdmin: 1 },
        bindings: { total: 48213, verified: 46027, byServer: [{ key: "cn", count: 11894 }, { key: "jp", count: 30102 }, { key: "tw", count: 6217 }] },
      })
    }
    if (call.path === LIST_PATH && call.method === "GET") {
      const items = bindings
        .filter((binding) => !call.query.verified || String(binding.verified) === call.query.verified)
        .filter((binding) => !call.query.server || binding.server === call.query.server)
      return reply({
        generatedAt: "2026-11-09T00:00:00Z",
        page: 1,
        pageSize: Number(call.query.page_size ?? 50),
        total: items.length,
        totalPages: items.length > 0 ? 1 : 0,
        hasMore: false,
        sort: call.query.sort ?? "id_desc",
        filters: {},
        items,
      })
    }
    if (call.method === "PUT" && /^\/api\/admin\/users\/[^/]+\/game-account-bindings\/[^/]+\/[^/]+$/.test(call.path)) {
      return reply({})
    }
    return route.abort()
  })

  await page.goto("/admin/game-bindings")
  return calls
}

function bindingRow(page: Page, key: string) {
  return page.locator(`tr[data-binding="${key}"]`)
}

test.describe("admin game bindings", () => {
  test.describe.configure({ timeout: 60_000 })

  test("lists bindings with site-wide figures and filters by verification", async ({ page }) => {
    const calls = await openBindings(page)

    // First visit to the admin chunk on a cold dev server: allow for the transform.
    const first = bindingRow(page, "jp:7480000000000001")
    await expect(first).toBeVisible({ timeout: 30_000 })

    // Site-wide tiles from the dashboard statistics; unverified is the rest.
    const stats = page.getByTestId("game-binding-stats")
    await expect(stats).toContainText("48,213")
    await expect(stats).toContainText("46,027")
    await expect(stats).toContainText("2,186")
    await expect(stats).toContainText(/日服\s*30,102 · 62%|Japan\s*30,102 · 62%/)
    // Sharing of the three rows shown: one has the public query on.
    await expect(stats).toContainText(/账号数据 · 公开查询\s*1 · 33%|Suite · public query\s*1 · 33%/)
    expect(calls.filter((call) => call.path === STATS_PATH)).toHaveLength(1)

    // Rows: owner with a staff mark, verification, what is shared.
    await expect(first).toContainText("Seiun")
    await expect(first).toContainText(/管理员|Admin/)
    await expect(first).toContainText(/已验证|Verified/)
    await expect(first).toContainText(/账号 2\/5 · 烤森 1\/5|Suite 2\/5 · MySekai 1\/5/)
    await expect(first).toContainText(/已开启公开查询|Public query on/)
    await expect(bindingRow(page, "cn:7480000000000002")).toContainText(/未验证|Unverified/)
    // No name: the user id stands in for it.
    await expect(bindingRow(page, "tw:7480000000000003")).toContainText("8532047003")

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

    await page.getByRole("combobox", { name: /验证状态|Verification/ }).click()
    await page.getByRole("option", { name: /^(未验证|Unverified)$/ }).click()
    await page.getByRole("button", { name: /^(查询|Search)$/ }).click()
    await expect(first).toHaveCount(0)
    await expect(bindingRow(page, "cn:7480000000000002")).toBeVisible()
    const listCalls = calls.filter((call) => call.path === LIST_PATH)
    expect(listCalls.at(-1)?.query).toMatchObject({ page: "1", verified: "false" })
    await expect(page).toHaveURL(/verified=false/)
  })

  test("edits the sharing switches of a binding", async ({ page }) => {
    const calls = await openBindings(page)
    const row = bindingRow(page, "jp:7480000000000001")
    await expect(row).toBeVisible({ timeout: 30_000 })

    await row.getByRole("button", { name: /打开菜单|Open menu/ }).click()
    await page.getByRole("menuitem", { name: /^(编辑|Edit)$/ }).click()
    const dialog = page.getByRole("dialog")
    // The identity is fixed: shown, not editable.
    await expect(dialog.getByTestId("admin-binding-identity")).toContainText("7480000000000001")
    await expect(dialog.getByTestId("admin-binding-identity")).toContainText("8532047001")
    await expect(dialog.locator("input")).toHaveCount(0)

    const suite = dialog.getByTestId("admin-binding-permissions-suite")
    const publicQuery = suite.getByRole("switch", { name: /公开查询|public/i })
    await expect(publicQuery).toBeChecked()
    await publicQuery.click()
    await suite.getByRole("switch", { name: /LunaBot/ }).click()
    await dialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    await expect(dialog).toBeHidden()
    expect(calls.filter((call) => call.method === "PUT")).toEqual([
      {
        method: "PUT",
        path: "/api/admin/users/8532047001/game-account-bindings/jp/7480000000000001",
        query: {},
        body: {
          suite: { allowPublicApi: false, allowSakura: true, allow8823: false, allowResona: false, allowLuna: true },
          mysekai: { allowPublicApi: false, allowFixtureApi: true, allow8823: false, allowResona: false, allowLuna: false },
        },
      },
    ])
  })

  test("keeps the list usable when the site-wide figures fail", async ({ page }) => {
    await openBindings(page, { failingStats: true })
    await expect(bindingRow(page, "jp:7480000000000001")).toBeVisible({ timeout: 30_000 })

    const stats = page.getByTestId("game-binding-stats")
    await expect(stats).toContainText(/全站统计加载失败|Could not load the site-wide figures/, { timeout: 15_000 })
    await expect(stats.getByRole("button", { name: /^(重试|Retry)$/ })).toBeVisible()
    // The list's own total still shows.
    await expect(stats).toContainText(/第 1 \/ 1 页|Page 1 of 1/)
  })
})
