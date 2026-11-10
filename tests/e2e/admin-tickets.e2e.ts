import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const ADMIN_USER_ID = "admin-tickets-test"
const APP_HOST = "127.0.0.1:4173"
const NOW = "2026-11-10T08:00:00Z"

// JSON names follow the backend's admintickets/ticket_types.go.
type MockTicket = {
  ticketId: string
  creatorUserId: string
  creatorUserName?: string
  subject: string
  category: string
  priority: string
  status: string
  assigneeAdminId?: string
  assigneeAdminName?: string
  lastMessageSenderRole?: string
  lastMessagePreview?: string
  lastMessageInternal?: boolean
  lastMessageAt?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

const ADMINS = [
  { userId: ADMIN_USER_ID, name: "Root", email: "root@example.com", role: "super_admin", banned: false },
  { userId: "1200450078", name: "Mafuyu", email: "mafuyu@example.com", role: "admin", banned: false },
]

const STATUSES = ["pending_admin", "open", "pending_user", "resolved", "closed"] as const
const PRIORITIES = ["normal", "high", "low", "urgent"] as const
const CATEGORIES = ["upload", "account", "bug", "feature", "other"] as const
const LONG_SUBJECT = "Transfer code upload stuck: ERR_SUITE_DECODE_FAILED_AT_OFFSET_0x00000000000000000000000000000000000000000000FF"

function minutesBefore(minutes: number): string {
  return new Date(Date.parse(NOW) - minutes * 60_000).toISOString()
}

// 23 tickets: two pages at the default page size of 20.
const TICKETS: MockTicket[] = Array.from({ length: 23 }, (_, index) => {
  const status = STATUSES[index % STATUSES.length]!
  const ticket: MockTicket = {
    ticketId: `TK-${String(index + 1).padStart(3, "0")}`,
    creatorUserId: `33440${String(index % 4).padStart(2, "0")}`,
    creatorUserName: index % 4 === 3 ? undefined : ["Ena", "Mizuki", "a_really_long_username_without_spaces_0123456789"][index % 4],
    subject: index === 1 ? LONG_SUBJECT : `工单 ${index + 1}：上传数据失败`,
    category: CATEGORIES[index % CATEGORIES.length]!,
    priority: PRIORITIES[index % PRIORITIES.length]!,
    status,
    createdAt: minutesBefore(3000 + index * 90),
    updatedAt: minutesBefore(10 + index * 90),
  }
  if (index % 3 === 1) {
    ticket.assigneeAdminId = "1200450078"
    ticket.assigneeAdminName = "Mafuyu"
  }
  if (index % 3 === 2) {
    ticket.assigneeAdminId = ADMIN_USER_ID
    ticket.assigneeAdminName = "Root"
  }
  if (index === 0) {
    ticket.lastMessageSenderRole = "system"
    ticket.lastMessagePreview = "Status changed: Pending user -> Pending admin"
    ticket.lastMessageInternal = true
    ticket.lastMessageAt = ticket.updatedAt
  } else {
    ticket.lastMessageSenderRole = "user"
    ticket.lastMessagePreview = "我又试了一次还是不行"
    ticket.lastMessageInternal = false
    ticket.lastMessageAt = ticket.updatedAt
  }
  if (status === "closed") ticket.closedAt = ticket.updatedAt
  return ticket
})

const DETAIL_ID = "TK-001"
const DETAIL_CREATED = "2026-11-09T04:00:00Z"

function detailMessages() {
  const at = (minutes: number) => new Date(Date.parse(DETAIL_CREATED) + minutes * 60_000).toISOString()
  const user = { senderUserId: "3344000", senderUserName: "Ena", senderRole: "user", internal: false }
  return [
    { id: 1, ...user, message: "上传 suite 数据一直失败。\n账号 ID：7483920184756", createdAt: at(0) },
    { id: 2, senderRole: "system", internal: true, message: "Assignee changed: Unassigned -> Mafuyu (1200450078)", createdAt: at(14) },
    { id: 3, senderUserId: "1200450078", senderUserName: "Mafuyu", senderRole: "admin", internal: false, message: "收到，请问模块版本是多少？", createdAt: at(16) },
    { id: 4, senderRole: "system", internal: true, message: "Status changed: Open -> Pending user", createdAt: at(16) },
    { id: 5, ...user, message: `日志：https://paste.example.com/raw/${"8f3a2c9d".repeat(12)}`, createdAt: at(95) },
    { id: 6, senderUserId: ADMIN_USER_ID, senderUserName: "Root", senderRole: "admin", internal: true, message: "CN02 回源超时，先别回复用户。", createdAt: at(133) },
    { id: 7, senderUserId: "1200450078", senderUserName: "Mafuyu", senderRole: "admin", internal: false, message: "已修复，请重新上传。", createdAt: at(140) },
    ...Array.from({ length: 8 }, (_, index) => ({ id: 20 + index, ...user, message: `补充说明 ${index + 1}\n第二行`, createdAt: at(200 + index * 10) })),
    // 2026-11-09T10:50Z: 21 h 10 min before NOW.
    { id: 40, ...user, message: "今天再次上传又出现了同样的错误", createdAt: at(410) },
  ]
}

function filterTickets(query: URLSearchParams): MockTicket[] {
  let rows = TICKETS
  const quick = query.get("quick_filter")
  const status = query.get("status") ?? (quick === "pending_admin" || quick === "pending_user" ? quick : null)
  if (status) rows = rows.filter((ticket) => ticket.status === status)
  const priority = query.get("priority")
  if (priority) rows = rows.filter((ticket) => ticket.priority === priority)
  if (quick === "unassigned") rows = rows.filter((ticket) => !ticket.assigneeAdminId)
  if (quick === "mine") rows = rows.filter((ticket) => ticket.assigneeAdminId === ADMIN_USER_ID)
  return rows
}

function count(query: Record<string, string>): number {
  return filterTickets(new URLSearchParams(query)).length
}

type MockOptions = {
  theme?: "light" | "dark"
  /** Every ticket list request fails. */
  listFails?: boolean
  /** The backend has no ticket at all. */
  noTickets?: boolean
}

async function mockAdminTickets(page: Page, options: MockOptions = {}) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(({ userId, theme }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Root",
      userId,
      role: "super_admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme }))
  }, { userId: ADMIN_USER_ID, theme: options.theme ?? "light" })

  const calls = {
    /** Single-row list requests: the stat panel's counts and the nav badge. */
    counts: [] as string[],
    /** Full-page list requests. */
    lists: [] as string[],
    writes: [] as { method: string; path: string; body: unknown }[],
  }

  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) return route.continue()
    const ok = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "ok", updatedData }),
    })
    const fail = (status: number, message: string) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ status, message }),
    })
    const path = url.pathname
    if (path === `/api/user/${ADMIN_USER_ID}/get-settings`) return ok({})
    if (path === "/api/admin/me/ticket-notifications") return ok({ ticketEmailNotificationsEnabled: true })
    if (path === "/api/admin/users") {
      const items = ADMINS.filter((admin) => admin.role === url.searchParams.get("role"))
      return ok({ items, total: items.length, page: 1, pageSize: 200, totalPages: 1, hasMore: false })
    }
    if (path === "/api/admin/tickets") {
      const single = url.searchParams.get("page_size") === "1"
      ;(single ? calls.counts : calls.lists).push(url.search)
      if (options.listFails) return fail(500, "failed to query tickets")
      const rows = options.noTickets ? [] : filterTickets(url.searchParams)
      const pageNo = Number(url.searchParams.get("page") ?? 1)
      const pageSize = Number(url.searchParams.get("page_size") ?? 50)
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
      return ok({
        generatedAt: NOW,
        page: pageNo,
        pageSize,
        total: rows.length,
        totalPages,
        hasMore: pageNo < totalPages,
        items: rows.slice((pageNo - 1) * pageSize, pageNo * pageSize),
      })
    }
    const write = /^\/api\/admin\/tickets\/[^/]+\/(messages|status|assign)$/.exec(path)
    if (write) {
      calls.writes.push({ method: request.method(), path, body: request.postDataJSON() })
      return ok({})
    }
    if (path === `/api/admin/tickets/${DETAIL_ID}`) {
      return ok({ ticket: { ...TICKETS[0]!, createdAt: DETAIL_CREATED }, messages: detailMessages() })
    }
    if (path === "/api/admin/tickets/TK-BROKEN") return fail(500, "failed to query ticket detail")
    if (path.startsWith("/api/admin/tickets/")) return fail(404, "ticket not found")
    return route.abort()
  })
  return calls
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
}

for (const theme of ["light", "dark"] as const) {
  test(`ticket list shows whole-set figures, a page-only category split and a table of links (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const calls = await mockAdminTickets(page, { theme })
    await page.goto("/admin/tickets")

    // Tiles: the `total` of single-row list requests, not a tally of the page on screen.
    const stats = page.getByTestId("admin-ticket-stats")
    await expect(stats.locator("[data-stat=pending-admin]")).toContainText(String(count({ status: "pending_admin" })))
    await expect(stats.locator("[data-stat=pending-admin]")).toContainText(`待用户回复 ${count({ status: "pending_user" })}`)
    await expect(stats.locator("[data-stat=open]")).toContainText(String(count({ status: "open" })))
    await expect(stats.locator("[data-stat=unassigned]")).toContainText(String(count({ quick_filter: "unassigned" })))
    await expect(stats.locator("[data-stat=unassigned]")).toContainText(`分配给我 ${count({ quick_filter: "mine" })}`)
    await expect(stats.locator("[data-stat=total]")).toContainText("23")
    await expect(stats.locator("[data-stat=total]")).toContainText("未结 15 · 已结 8")

    // Each breakdown says what it covers.
    const breakdowns = page.getByTestId("admin-ticket-breakdowns")
    await expect(breakdowns.locator("[data-breakdown=status]")).toContainText("全部 23 个工单")
    await expect(breakdowns.locator("[data-breakdown=status]")).toContainText(`${count({ status: "closed" })} · 17%`)
    await expect(breakdowns.locator("[data-breakdown=priority]")).toContainText("全部 23 个工单")
    await expect(breakdowns.locator("[data-breakdown=category]")).toContainText("仅本页显示的 20 个工单")
    await expect(breakdowns.locator("[data-breakdown=category]")).toContainText("4 · 20%")

    // The list: captions, twenty linked rows, the system line in the admin's language.
    const table = page.getByTestId("admin-ticket-table")
    await expect(table.getByText("创建者 / 处理人")).toBeVisible()
    const rows = table.locator("[data-slot=admin-ticket-row]")
    await expect(rows).toHaveCount(20)
    await expect(rows.first()).toHaveAttribute("href", `/admin/tickets/${DETAIL_ID}`)
    await expect(rows.first()).toContainText("状态由「待用户回复」变更为「待管理员处理」")
    await expect(rows.first()).toContainText("待管理员处理")
    await expect(table.getByText("共 23 个工单")).toBeVisible()
    await expectNoPageOverflow(page)

    const shotDir = process.env.E2E_SHOT_DIR
    if (shotDir) {
      await page.screenshot({ path: `${shotDir}/admin-tickets-list-${theme}.png`, fullPage: true })
    }

    // A filter reloads the list only; the whole-set figures are not asked for again.
    const statRequests = calls.counts.filter((search) => !search.includes("quick_filter=pending_admin")).length
    expect(statRequests).toBe(11)
    await page.getByRole("combobox", { name: "全部状态" }).click()
    await page.getByRole("option", { name: "已关闭", exact: true }).click()
    await expect(rows).toHaveCount(count({ status: "closed" }))
    await expect(page).toHaveURL(/status=closed/)
    expect(calls.lists.at(-1)).toContain("status=closed")
    expect(calls.counts.filter((search) => !search.includes("quick_filter=pending_admin")).length).toBe(statRequests)
    await expect(breakdowns.locator("[data-breakdown=category]")).toContainText(`仅本页显示的 ${count({ status: "closed" })} 个工单`)
    await expect(stats.locator("[data-stat=total]")).toContainText("23")

    // The refresh button reloads both.
    await page.getByRole("button", { name: "刷新", exact: true }).click()
    await expect.poll(() => calls.counts.filter((search) => !search.includes("quick_filter=pending_admin")).length).toBe(statRequests * 2)

    await rows.first().click()
    await expect(page).toHaveURL(/\/admin\/tickets\/TK-005$/)
  })
}

test("ticket list folds its rows on a phone and keeps the breakdowns under the queue", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAdminTickets(page)
  await page.goto("/admin/tickets")

  const table = page.getByTestId("admin-ticket-table")
  const rows = table.locator("[data-slot=admin-ticket-row]")
  await expect(rows).toHaveCount(20)
  await expect(table.getByText("创建者 / 处理人")).toBeHidden()
  // The long unbroken subject wraps inside its row.
  await expect(rows.nth(1)).toContainText("ERR_SUITE_DECODE_FAILED")
  await expectNoPageOverflow(page)

  const tableBox = await table.boundingBox()
  const statsBox = await page.getByTestId("admin-ticket-stats").boundingBox()
  const breakdownsBox = await page.getByTestId("admin-ticket-breakdowns").boundingBox()
  expect(statsBox!.y).toBeLessThan(tableBox!.y)
  expect(breakdownsBox!.y).toBeGreaterThan(tableBox!.y + tableBox!.height - 1)

  const shotDir = process.env.E2E_SHOT_DIR
  if (shotDir) {
    await page.screenshot({ path: `${shotDir}/admin-tickets-list-phone.png`, fullPage: true })
  }
})

test("ticket list tells an empty queue from filters that match nothing", async ({ page }) => {
  await mockAdminTickets(page, { noTickets: true })
  await page.goto("/admin/tickets")
  const table = page.getByTestId("admin-ticket-table")
  await expect(table.getByText("暂无工单")).toBeVisible()
  await expect(page.getByTestId("admin-ticket-stats").locator("[data-stat=total]")).toContainText("0")
  await expect(page.getByTestId("admin-ticket-breakdowns").locator("[data-breakdown=status]")).toContainText("暂无数据")

  await page.goto("/admin/tickets?priority=urgent")
  await expect(table.getByText("没有符合筛选条件的工单")).toBeVisible()
  await table.getByRole("button", { name: "重置筛选" }).last().click()
  await expect(table.getByText("暂无工单")).toBeVisible()
  await expect(page).not.toHaveURL(/priority=/)
})

test("ticket list reports a failed load inline, for the list and for the figures", async ({ page }) => {
  await mockAdminTickets(page, { listFails: true })
  await page.goto("/admin/tickets")
  await expect(page.getByTestId("admin-ticket-table").getByText("加载工单列表失败")).toBeVisible()
  const stats = page.getByTestId("admin-ticket-stats")
  await expect(stats.getByRole("alert")).toContainText("统计数据没有全部加载出来")
  await expect(stats.getByRole("button", { name: "重试" })).toBeVisible()
  // Unknown, not zero.
  await expect(stats.locator("[data-stat=total]")).toContainText("—")
  await expect(page.getByTestId("admin-ticket-breakdowns").locator("[data-breakdown=status]")).toContainText("统计数据加载失败")
})

for (const width of [1440, 390] as const) {
  test(`ticket detail shows the ticket, its thread and the thread's figures (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockAdminTickets(page)
    await page.goto(`/admin/tickets/${DETAIL_ID}`)

    const summary = page.getByTestId("admin-ticket-summary")
    await expect(summary.getByRole("heading", { level: 1 })).toHaveText("工单 1：上传数据失败")
    await expect(summary.locator("[data-chip=status]")).toHaveText("待管理员处理")
    await expect(summary.locator("[data-chip=category]")).toContainText("上传问题")
    await expect(summary.getByRole("link", { name: "Ena" })).toHaveAttribute("href", "/admin/users/3344000")
    // The creator is not on the admin list the page loads, so they are an ordinary user.
    await expect(summary.locator("dl > div").first()).toContainText("用户")

    // The thread: system lines translated, the internal note marked, roles from the admin list.
    const conversation = page.getByTestId("admin-ticket-conversation")
    await expect(conversation.getByText("已分配给 Mafuyu (1200450078)")).toBeAttached()
    await expect(conversation.getByText("状态由「已开启」变更为「待用户回复」")).toBeAttached()
    const note = conversation.locator("li[data-internal][data-sender-role=admin]")
    await expect(note).toHaveCount(1)
    await expect(note).toContainText("内部备注")
    await expect(note).toContainText("超级管理员")
    await expect(conversation.getByRole("link", { name: /paste\.example\.com/ })).toHaveAttribute("target", "_blank")

    // It opens on the latest message.
    await expect(conversation.getByText("今天再次上传又出现了同样的错误")).toBeVisible()
    await expect.poll(() => conversation.locator("[data-slot=admin-ticket-thread]").evaluate((thread) => {
      const box = thread.parentElement!
      return box.scrollHeight > box.clientHeight && box.scrollTop + box.clientHeight >= box.scrollHeight - 2
    })).toBe(true)

    // Figures of the whole thread, read at the (fixed) load time.
    const figures = page.getByTestId("admin-ticket-thread-stats")
    await expect(figures.locator("[data-stat=user-messages]")).toContainText("11")
    await expect(figures.locator("[data-stat=admin-replies]")).toContainText("2")
    await expect(figures.locator("[data-stat=admin-replies]")).toContainText("内部备注 1")
    await expect(figures.locator("[data-stat=first-response]")).toContainText("16 分钟")
    await expect(figures.locator("[data-stat=waiting]")).toContainText("用户已等待")
    await expect(figures.locator("[data-stat=waiting]")).toContainText("21 小时 10 分")
    await expectNoPageOverflow(page)

    const shotDir = process.env.E2E_SHOT_DIR
    if (shotDir) {
      await page.screenshot({ path: `${shotDir}/admin-tickets-detail-${width}.png`, fullPage: true })
    }
  })
}

test("ticket detail keeps the status, assignment and reply actions working", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const calls = await mockAdminTickets(page)
  await page.goto(`/admin/tickets/${DETAIL_ID}`)
  const actions = page.getByTestId("admin-ticket-actions")

  await actions.getByRole("combobox", { name: "变更状态" }).click()
  await page.getByRole("option", { name: "已解决", exact: true }).click()
  await expect.poll(() => calls.writes.at(-1)).toEqual({
    method: "PUT",
    path: `/api/admin/tickets/${DETAIL_ID}/status`,
    body: { status: "resolved" },
  })

  await actions.getByRole("combobox", { name: "处理人" }).click()
  await page.getByRole("option", { name: "Mafuyu (1200450078)" }).click()
  await actions.getByRole("button", { name: "分配" }).click()
  await expect.poll(() => calls.writes.at(-1)).toEqual({
    method: "PUT",
    path: `/api/admin/tickets/${DETAIL_ID}/assign`,
    body: { assigneeAdminId: "1200450078" },
  })

  const conversation = page.getByTestId("admin-ticket-conversation")
  await expect(conversation.getByRole("button", { name: "发送" })).toBeDisabled()
  await page.locator("#internal-toggle").click()
  await conversation.getByPlaceholder("输入内部备注（仅管理员可见）…").fill("先别回复用户")
  await conversation.getByRole("button", { name: "备注" }).click()
  await expect.poll(() => calls.writes.at(-1)).toEqual({
    method: "POST",
    path: `/api/admin/tickets/${DETAIL_ID}/messages`,
    body: { message: "先别回复用户", internal: true },
  })
  // Sent: the box is empty again and back to a public reply.
  await expect(conversation.getByPlaceholder("输入回复…")).toHaveValue("")
})

test("ticket detail tells a missing ticket from a failed load", async ({ page }) => {
  await mockAdminTickets(page)
  await page.goto("/admin/tickets/TK-NOPE")
  const detail = page.getByTestId("admin-ticket-detail")
  await expect(detail.getByText("工单不存在，可能已被删除或链接有误。")).toBeVisible()
  await detail.getByRole("button", { name: "返回工单列表" }).last().click()
  await expect(page).toHaveURL(/\/admin\/tickets$/)

  await page.goto("/admin/tickets/TK-BROKEN")
  await expect(detail.getByText("加载工单详情失败")).toBeVisible()
  await expect(detail.getByRole("button", { name: "重试" })).toBeVisible()
})
