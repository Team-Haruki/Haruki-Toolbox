import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// The signed-in user's own ticket pages (/tickets, /tickets/new, /tickets/:id)
// against a mocked backend. JSON names follow the backend's
// usertickets/ticket_types.go: the user endpoints send no names, no sender
// ids and no "last message" fields, and never an internal message.
const USER_ID = "user-tickets-test"
const APP_HOST = "127.0.0.1:4173"
const NOW = "2026-11-12T08:00:00Z"
const API = `/api/user/${USER_ID}`

type MockTicket = {
  ticketId: string
  subject: string
  category?: string
  priority: string
  status: string
  assigneeAdminId?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

type MockMessage = { id: number; senderRole: string; message: string; createdAt: string }

function minutesBefore(minutes: number): string {
  return new Date(Date.parse(NOW) - minutes * 60_000).toISOString()
}

const LONG_SUBJECT = "Transfer code upload stuck: ERR_SUITE_DECODE_FAILED_AT_OFFSET_0x00000000000000000000000000000000000000000000FF"
const WAITING_ID = "TK-20261111060000-9f3a2c7d81b4"
const LONG_THREAD_ID = "TK-20261109120000-77aa77aa77aa"
const NEW_TICKET_ID = "TK-20261112080000-0123456789ab"

function seedTickets(): MockTicket[] {
  return [
    { ticketId: WAITING_ID, subject: "上传 suite 数据一直失败", category: "upload", priority: "high", status: "pending_user", assigneeAdminId: "1200450078", createdAt: minutesBefore(1560), updatedAt: minutesBefore(42) },
    { ticketId: "TK-20261111101500-a1b2c3d4e5f6", subject: "无法绑定日服账号", category: "account", priority: "normal", status: "pending_admin", assigneeAdminId: "1200450078", createdAt: minutesBefore(2900), updatedAt: minutesBefore(190) },
    { ticketId: "TK-20261111080000-0c0c0c0c0c0c", subject: "建议：组卡推荐支持保存多套预设", category: "feature", priority: "low", status: "open", createdAt: minutesBefore(1440), updatedAt: minutesBefore(1440) },
    { ticketId: LONG_THREAD_ID, subject: LONG_SUBJECT, category: "bug", priority: "urgent", status: "pending_admin", createdAt: minutesBefore(4400), updatedAt: minutesBefore(4300) },
    { ticketId: "TK-20261105093000-5d5d5d5d5d5d", subject: "活动榜线页面横向溢出", category: "bug", priority: "normal", status: "resolved", createdAt: minutesBefore(10200), updatedAt: minutesBefore(8000) },
    // Seven closed tickets: 12 in all, two pages at the page size of 10.
    ...Array.from({ length: 7 }, (_, index): MockTicket => ({
      ticketId: `TK-2026090${index + 1}080000-00000000000${index}`,
      subject: `历史工单 ${index + 1}`,
      category: "other",
      priority: "normal",
      status: "closed",
      createdAt: minutesBefore(100_000 + index * 1500),
      updatedAt: minutesBefore(99_000 + index * 1500),
      closedAt: minutesBefore(99_000 + index * 1500),
    })),
  ]
}

function seedMessages(): Record<string, MockMessage[]> {
  return {
    [WAITING_ID]: [
      { id: 1, senderRole: "user", message: "上传一直失败。\n账号 ID：7483920184756", createdAt: "2026-11-10T04:00:00Z" },
      { id: 2, senderRole: "admin", message: "收到，请把日志发一下。", createdAt: "2026-11-10T04:16:00Z" },
      { id: 3, senderRole: "user", message: `日志：https://paste.example.com/raw/${"8f3a2c9d".repeat(12)}`, createdAt: "2026-11-12T04:00:00Z" },
      { id: 4, senderRole: "admin", message: "已修复，请重新上传。", createdAt: "2026-11-12T07:18:00Z" },
    ],
    [LONG_THREAD_ID]: Array.from({ length: 12 }, (_, index) => ({
      id: 100 + index,
      senderRole: index % 3 === 2 ? "admin" : "user",
      message: `第 ${index + 1} 条消息\n第二行`,
      createdAt: new Date(Date.parse("2026-11-09T04:00:00Z") + index * 600_000).toISOString(),
    })),
  }
}

type Reply = { status: number; message: string }

type MockOptions = {
  theme?: "light" | "dark"
  /** The backend has no ticket at all. */
  noTickets?: boolean
  /** Replies served, in order, to full-page list requests before the normal ones. */
  listReplies?: Reply[]
}

async function mockTickets(page: Page, options: MockOptions = {}) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(({ userId, theme }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Ena",
      userId,
      role: "user",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme }))
  }, { userId: USER_ID, theme: options.theme ?? "light" })

  const tickets = options.noTickets ? [] : seedTickets()
  const messages = seedMessages()
  const listReplies = [...(options.listReplies ?? [])]
  const calls = {
    /** Full-page list requests (the one-row count requests are left out). */
    lists: [] as string[],
    writes: [] as { path: string; body: unknown }[],
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
    const method = request.method()
    if (path === `${API}/get-settings`) return ok({})

    if (path === `${API}/tickets` && method === "GET") {
      const pageSize = Number(url.searchParams.get("page_size") ?? 20)
      if (pageSize > 1) {
        calls.lists.push(url.search)
        const queued = listReplies.shift()
        if (queued) return fail(queued.status, queued.message)
      }
      const status = url.searchParams.get("status")
      const rows = status ? tickets.filter((ticket) => ticket.status === status) : tickets
      const pageNo = Number(url.searchParams.get("page") ?? 1)
      const totalPages = Math.ceil(rows.length / pageSize)
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

    if (path === `${API}/tickets` && method === "POST") {
      const body = request.postDataJSON() as { subject: string; category: string; priority: string; message: string }
      calls.writes.push({ path, body })
      tickets.unshift({ ticketId: NEW_TICKET_ID, subject: body.subject, category: body.category, priority: body.priority, status: "open", createdAt: NOW, updatedAt: NOW })
      messages[NEW_TICKET_ID] = [{ id: 900, senderRole: "user", message: body.message, createdAt: NOW }]
      return ok({ ticketId: NEW_TICKET_ID })
    }

    const action = /^\/tickets\/([^/]+)(?:\/(messages|close))?$/.exec(path.slice(API.length))
    if (!action) return route.abort()
    const ticketId = decodeURIComponent(action[1]!)
    if (ticketId === "TK-BROKEN") return fail(500, "failed to query ticket detail")
    const ticket = tickets.find((item) => item.ticketId === ticketId)
    if (!ticket) return fail(404, "ticket not found")

    if (action[2] === "messages" && method === "POST") {
      const body = request.postDataJSON() as { message: string }
      calls.writes.push({ path, body })
      const created = { id: 1000 + calls.writes.length, senderRole: "user", message: body.message, createdAt: NOW }
      messages[ticketId] = [...(messages[ticketId] ?? []), created]
      // tickets/service.go AppendUserMessage: a user reply hands the ticket back to the admins.
      ticket.status = "pending_admin"
      ticket.updatedAt = NOW
      return ok(created)
    }
    if (action[2] === "close" && method === "POST") {
      calls.writes.push({ path, body: null })
      ticket.status = "closed"
      ticket.closedAt = NOW
      ticket.updatedAt = NOW
      return ok(ticket)
    }
    if (!action[2] && method === "GET") {
      return ok({ ticket, messages: messages[ticketId] ?? [{ id: 1, senderRole: "user", message: "问题描述", createdAt: ticket.createdAt }] })
    }
    return route.abort()
  })
  return calls
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
}

for (const theme of ["light", "dark"] as const) {
  test(`my tickets lists each ticket with whose turn it is and when it last moved (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockTickets(page, { theme })
    await page.goto("/tickets")

    await expect(page.getByRole("heading", { level: 1, name: "我的工单" })).toBeVisible()
    const rows = page.locator("[data-slot='ticket-row']")
    await expect(rows).toHaveCount(10)

    // The ticket that waits for the user: its status in their words, bold, and how long ago it moved.
    const waiting = rows.nth(0)
    await expect(waiting).toHaveAttribute("href", `/tickets/${WAITING_ID}`)
    await expect(waiting).toHaveAttribute("data-stage", "waitingUser")
    await expect(waiting.locator("[data-chip=status]")).toHaveText("等你回复")
    await expect(waiting).toContainText("上传问题 · 高优先级")
    await expect(waiting.locator("time")).toContainText("42分钟前")

    // A ticket with the admins says whether one has picked it up; the default priority is not named.
    await expect(rows.nth(1).locator("[data-chip=status]")).toHaveText("处理中")
    await expect(rows.nth(1)).toContainText("账号问题 · 已有管理员跟进")
    await expect(rows.nth(1)).not.toContainText("普通优先级")
    await expect(rows.nth(2).locator("[data-chip=status]")).toHaveText("待处理")
    await expect(rows.nth(2).locator("time")).toContainText("1天前")
    await expect(rows.nth(4).locator("[data-chip=status]")).toHaveText("已解决")
    // A closed ticket says when it was closed; past a week the age is a date.
    await expect(rows.nth(5).locator("[data-chip=status]")).toHaveText("已关闭")
    await expect(rows.nth(5)).toContainText("关闭于")

    // The whole set's size, and the filter chip that carries how many wait for the user.
    await expect(page.getByTestId("ticket-total")).toContainText("共 12 个工单")
    await expect(page.getByTestId("ticket-total")).toContainText("第 1 / 2 页")
    await expect(page.getByTestId("ticket-waiting-count")).toContainText("1")

    await expectNoPageOverflow(page)
  })
}

test("the status chips and the pager filter the list through the URL", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const calls = await mockTickets(page)
  await page.goto("/tickets")
  const rows = page.locator("[data-slot='ticket-row']")
  await expect(rows).toHaveCount(10)

  await page.getByTestId("ticket-next-page").click()
  await expect(rows).toHaveCount(2)
  await expect(page).toHaveURL(/[?&]page=2/)
  await expect(page.getByTestId("ticket-next-page")).toBeDisabled()

  // A filter starts over from the first page.
  const filter = page.getByTestId("ticket-status-filter")
  await filter.locator("[data-status=closed]").click()
  await expect(rows).toHaveCount(7)
  await expect(page).toHaveURL(/[?&]status=closed/)
  await expect(page).not.toHaveURL(/page=/)
  expect(calls.lists.at(-1)).toContain("status=closed")
  await expect(page.getByTestId("ticket-total")).toHaveText("共 7 个工单")

  // The filter is restored from the URL on a reload.
  await page.goto("/tickets?status=pending_user")
  await expect(rows).toHaveCount(1)
  await expect(filter.locator("[data-status=pending_user]")).toHaveAttribute("data-state", "on")

  // A row is a link to its ticket, and the ticket's back link returns to the list.
  await rows.nth(0).click()
  await expect(page).toHaveURL(new RegExp(`/tickets/${WAITING_ID}$`))
  await expect(page.getByRole("heading", { level: 1, name: "上传 suite 数据一直失败" })).toBeVisible()
  await page.getByRole("link", { name: "返回工单列表" }).click()
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(rows).toHaveCount(10)
})

test("an empty list offers to create a ticket and an empty filter offers the whole list", async ({ page }) => {
  await mockTickets(page, { noTickets: true })
  await page.goto("/tickets")
  await expect(page.getByText("还没有工单")).toBeVisible()
  await expect(page.locator("[data-slot='ticket-row']")).toHaveCount(0)
  await expect(page.getByTestId("ticket-waiting-count")).toHaveCount(0)

  await page.getByTestId("ticket-status-filter").locator("[data-status=resolved]").click()
  await expect(page.getByText("没有「已解决」的工单")).toBeVisible()
  await page.getByRole("button", { name: "查看全部工单" }).click()
  await expect(page.getByText("还没有工单")).toBeVisible()

  await page.locator("[data-slot='empty-state']").getByRole("link", { name: "创建工单" }).click()
  await expect(page).toHaveURL(/\/tickets\/new$/)
})

test("a failed list load is an error with a retry, not an empty list", async ({ page }) => {
  // A GET is retried once on a 5xx, so the error state needs two failures.
  const failure = { status: 500, message: "failed to query tickets" }
  await mockTickets(page, { listReplies: [failure, failure] })
  await page.goto("/tickets")

  const error = page.locator("[data-slot='load-error-state']")
  await expect(error).toContainText("加载工单列表失败")
  await expect(page.getByText("还没有工单")).toHaveCount(0)
  await expect(page.locator("[data-slot='ticket-row']")).toHaveCount(0)

  await error.getByRole("button", { name: "重试" }).click()
  await expect(page.locator("[data-slot='ticket-row']")).toHaveCount(10)
  await expect(error).toHaveCount(0)
})

test("the list folds to two-line rows on a phone without overflowing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockTickets(page)
  await page.goto("/tickets")
  await expect(page.locator("[data-slot='ticket-row']")).toHaveCount(10)
  // The long unbroken subject wraps inside its row.
  await expect(page.locator(`[data-ticket-id='${LONG_THREAD_ID}']`)).toContainText("Transfer code upload stuck")
  await expectNoPageOverflow(page)
  await page.setViewportSize({ width: 320, height: 700 })
  await expectNoPageOverflow(page)
})

test("creating a ticket validates inline, then opens the new ticket", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const calls = await mockTickets(page)
  await page.goto("/tickets/new")
  await expect(page.getByRole("heading", { level: 1, name: "创建工单" })).toBeVisible()

  const subject = page.getByLabel("主题")
  const description = page.getByLabel("描述")
  const submit = page.getByRole("button", { name: "提交工单" })

  // Nothing filled in: both fields say so, the first one takes focus, nothing is sent.
  await submit.click()
  await expect(page.getByText("请输入工单主题")).toBeVisible()
  await expect(page.getByText("请输入工单描述")).toBeVisible()
  await expect(subject).toBeFocused()
  await expect(subject).toHaveAttribute("aria-invalid", "true")
  expect(calls.writes).toHaveLength(0)

  // Typing clears a field's error; running past the limit is said at once.
  await subject.fill("上传数据失败")
  await expect(page.getByText("请输入工单主题")).toHaveCount(0)
  await subject.fill("题".repeat(201))
  await expect(page.getByText("主题最多 200 个字符")).toBeVisible()
  await expect(page.getByText("201 / 200")).toBeVisible()
  await subject.fill("  上传数据失败  ")
  await expect(page.getByText("主题最多 200 个字符")).toHaveCount(0)

  // The category picks what the description is asked to contain.
  const guide = page.getByTestId("ticket-message-guide")
  await description.fill("x")
  await expect(guide).toContainText("出现时间、操作步骤")
  await page.getByTestId("ticket-category").locator("[data-value=upload]").click()
  await expect(guide).toContainText("上传方式")
  await page.getByTestId("ticket-priority").locator("[data-value=high]").click()

  await description.fill("字".repeat(4001))
  await submit.click()
  await expect(page.getByText("描述最多 4000 个字符")).toBeVisible()
  expect(calls.writes).toHaveLength(0)

  await description.fill("区服：日服\n上传方式：模块\n报错：ERR_SUITE_DECODE_FAILED")
  await submit.click()

  // The new ticket opens straight away.
  await expect(page).toHaveURL(new RegExp(`/tickets/${NEW_TICKET_ID}$`))
  expect(calls.writes).toEqual([{
    path: `${API}/tickets`,
    body: {
      subject: "上传数据失败",
      category: "upload",
      priority: "high",
      message: "区服：日服\n上传方式：模块\n报错：ERR_SUITE_DECODE_FAILED",
    },
  }])
  await expect(page.getByRole("heading", { level: 1, name: "上传数据失败" })).toBeVisible()
  await expect(page.getByTestId("ticket-summary").locator("[data-chip=status]")).toHaveText("待处理")
  await expect(page.locator("[data-thread=message]")).toContainText(["报错：ERR_SUITE_DECODE_FAILED"])
})

test("the create form fits a phone and links usage questions to the groups", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockTickets(page)
  await page.goto("/tickets/new")
  await expect(page.getByTestId("ticket-create-tips").getByRole("link", { name: "推荐群聊" })).toHaveAttribute("href", "/friend-groups")
  await expectNoPageOverflow(page)
  await page.setViewportSize({ width: 320, height: 700 })
  await expectNoPageOverflow(page)
})

test("a ticket reads as a conversation, takes a reply and can be closed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const calls = await mockTickets(page)
  await page.goto(`/tickets/${WAITING_ID}`)

  await expect(page.getByRole("heading", { level: 1, name: "上传 suite 数据一直失败" })).toBeVisible()
  await expect(page.getByTestId("ticket-id")).toHaveText(WAITING_ID)
  const summary = page.getByTestId("ticket-summary")
  await expect(summary.locator("[data-chip=status]")).toHaveText("等你回复")
  await expect(page.getByTestId("ticket-status-hint")).toContainText("管理员已回复")
  await expect(summary).toContainText("上传问题")

  // The thread: who wrote each message, a date line per day, links as links.
  const thread = page.locator("[data-slot='ticket-thread']")
  const messages = thread.locator("[data-thread=message]")
  await expect(messages).toHaveCount(4)
  await expect(page.getByTestId("ticket-message-count")).toHaveText("4 条消息")
  await expect(thread.locator("[data-thread=day]")).toHaveCount(2)
  await expect(messages.nth(0)).toHaveAttribute("data-sender", "self")
  await expect(messages.nth(0)).toContainText("你")
  await expect(messages.nth(1)).toHaveAttribute("data-sender", "admin")
  await expect(messages.nth(1)).toContainText("管理员")
  await expect(messages.nth(2).getByRole("link")).toHaveAttribute("href", /^https:\/\/paste\.example\.com\/raw\//)
  await expectNoPageOverflow(page)

  // Reply: Enter sends, the thread updates in place and the ticket is the admins' again.
  const reply = page.getByLabel("回复", { exact: true })
  const send = page.getByRole("button", { name: "发送" })
  await expect(send).toBeDisabled()
  await reply.fill("重新上传后可以了\n谢谢")
  await reply.press("Enter")
  await expect(messages).toHaveCount(5)
  await expect(messages.nth(4)).toContainText("重新上传后可以了")
  await expect(reply).toHaveValue("")
  await expect(page.getByRole("status").filter({ hasText: "已发送" })).toBeVisible()
  await expect(summary.locator("[data-chip=status]")).toHaveText("处理中")
  expect(calls.writes).toEqual([{ path: `${API}/tickets/${WAITING_ID}/messages`, body: { message: "重新上传后可以了\n谢谢" } }])

  // A reply over the backend's limit is refused before it is sent.
  await reply.fill("字".repeat(4001))
  await expect(page.getByText("回复最多 4000 个字符")).toBeVisible()
  await expect(send).toBeDisabled()
  await reply.fill("")

  // Close: confirmed in a dialog; afterwards there is nothing to reply to, only a way to open a new ticket.
  await page.getByTestId("ticket-close").click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toContainText("确认关闭工单")
  await dialog.getByRole("button", { name: "确认关闭" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(summary.locator("[data-chip=status]")).toHaveText("已关闭")
  await expect(page.getByTestId("ticket-close")).toHaveCount(0)
  await expect(page.locator("[data-slot='ticket-reply']")).toHaveCount(0)
  await expect(page.getByTestId("ticket-closed-note")).toContainText("工单已关闭")
  await expect(page.getByTestId("ticket-closed-note").getByRole("link", { name: "创建新工单" })).toHaveAttribute("href", "/tickets/new")
  expect(calls.writes.at(-1)).toEqual({ path: `${API}/tickets/${WAITING_ID}/close`, body: null })
})

test("a long thread opens on its latest messages with the reply box in reach on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockTickets(page)
  await page.goto(`/tickets/${LONG_THREAD_ID}`)

  const messages = page.locator("[data-thread=message]")
  await expect(messages).toHaveCount(6)
  await expect(messages.last()).toContainText("第 12 条消息")
  await expect(page.getByTestId("ticket-message-count")).toHaveText("12 条消息")

  // The reply box is pinned to the bottom of the screen before any scrolling.
  const replyBox = page.locator("[data-slot='ticket-reply']")
  await expect(replyBox).toBeInViewport({ ratio: 1 })
  // The long unbroken subject wraps instead of widening the page.
  await expectNoPageOverflow(page)

  // The facts fold away on a phone and open on demand.
  await expect(page.locator("#ticket-info")).toBeHidden()
  await page.getByTestId("ticket-info-toggle").click()
  await expect(page.locator("#ticket-info")).toContainText("Bug反馈")

  await page.getByTestId("ticket-show-earlier").click()
  await expect(messages).toHaveCount(12)
  await expect(page.getByTestId("ticket-show-earlier")).toHaveCount(0)
  await expect(replyBox).toBeInViewport({ ratio: 1 })

  await page.setViewportSize({ width: 320, height: 700 })
  await expectNoPageOverflow(page)
})

test("a missing ticket and a failed load are different states", async ({ page }) => {
  await mockTickets(page)
  await page.goto("/tickets/TK-NOPE")
  await expect(page.getByText("工单不存在")).toBeVisible()
  await expect(page.locator("[data-slot='load-error-state']")).toHaveCount(0)
  await page.locator("[data-slot='empty-state']").getByRole("link", { name: "返回工单列表" }).click()
  await expect(page).toHaveURL(/\/tickets$/)

  await page.goto("/tickets/TK-BROKEN")
  const error = page.locator("[data-slot='load-error-state']")
  await expect(error).toContainText("加载工单详情失败")
  await expect(error.getByRole("button", { name: "重试" })).toBeVisible()
  await expect(page.getByText("工单不存在")).toHaveCount(0)
})
