import { expect, test, type Page, type Route, type WebSocketRoute } from "@playwright/test"

// The transfer-code upload runs as a backend job followed over a ticketed
// WebSocket (docs/inherit-jobs.md in the backend). Every backend call is
// mocked here: HTTP through page.route, the job socket through
// page.routeWebSocket.

const API_HOST = "127.0.0.1:9"
const JOB_ID = "6f1f8f8e-1111-4c4c-8888-000000000001"
const STEPS = [
  "bootstrap", "preview", "awaiting_confirm", "execute", "vault_store_credential", "login",
  "issue_new_code", "vault_store_code", "fetch_suite", "fetch_mysekai", "upload", "done",
] as const
type Step = (typeof STEPS)[number]

const NEW_CODE = { inherit_id: "NEWCODE987654321", password: "Rnd0mPassw0rd", expires_at: new Date(Date.now() + 24 * 3_600_000).toISOString() }

function job(status: string, stepStatus: Partial<Record<Step, string>>, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString()
  return {
    id: JOB_ID,
    server: "jp",
    upload_type: "suite",
    new_password_mode: "random",
    status,
    current_step: STEPS.filter((step) => stepStatus[step] && stepStatus[step] !== "pending").at(-1) ?? "bootstrap",
    steps: STEPS.map((name) => {
      const value = stepStatus[name] ?? "pending"
      return {
        name,
        status: value,
        ...(value !== "pending" && value !== "skipped" ? { started_at: now } : {}),
        ...(value === "done" || value === "failed" ? { finished_at: now } : {}),
        ...(name === "bootstrap" && value === "done"
          ? { substeps: [{ name: "cookies", status: "done", at: now }, { name: "version", status: "done", at: now }] }
          : {}),
      }
    }),
    unlock: { kind: "password", initialized: true },
    created_at: now,
    updated_at: now,
    ...extra,
  }
}

const PREVIEW = {
  nickname: "Miku",
  rank: 150,
  game_user_id_masked: "16*************363",
  transfer_restriction: {
    is_restrict_device_transfer: true,
    restrict_end_at: 4_102_444_800_000,
    rest_transfer_count: 2,
    is_world_bloom_chapter: false,
    restrict_rank: 0,
    game_character_id: 0,
  },
}

const AWAITING = () => job("awaiting_confirm", { bootstrap: "done", preview: "done", awaiting_confirm: "running" }, {
  preview: PREVIEW,
  confirm_deadline: new Date(Date.now() + 5 * 60_000).toISOString(),
})

const AFTER_CODE = () => job("running", {
  bootstrap: "done", preview: "done", awaiting_confirm: "done", execute: "done", vault_store_credential: "done",
  login: "done", issue_new_code: "done", vault_store_code: "done", fetch_suite: "running",
}, { preview: PREVIEW, new_code: NEW_CODE, vault_entry_id: "entry-1" })

const FAILED_AFTER_CODE = () => job("failed", {
  bootstrap: "done", preview: "done", awaiting_confirm: "done", execute: "done", vault_store_credential: "done",
  login: "done", issue_new_code: "done", vault_store_code: "done", fetch_suite: "failed",
}, {
  preview: PREVIEW,
  new_code: NEW_CODE,
  vault_entry_id: "entry-1",
  error: { code: "fetch_failed", message: "获取游戏数据失败" },
  finished_at: new Date().toISOString(),
})

function envelope(updatedData: unknown, status = 200, message = "ok") {
  return { status, contentType: "application/json", body: JSON.stringify({ status, message, updatedData }) }
}

function problem(status: number, code: string, message = code) {
  return envelope({ code }, status, message)
}

async function signIn(page: Page, extra: { legacyInherit?: boolean; activeJob?: boolean } = {}) {
  await page.addInitScript(({ legacyInherit, activeJob, jobId }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Inherit test",
      userId: "toolbox-test",
      gameAccountBindings: [],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    if (legacyInherit) {
      localStorage.setItem("haruki_inherit", JSON.stringify({
        inherit_id: "ABCDEFGH12345678", inherit_password: "old-secret", server: "en", type: "suite", timestamp: Date.now(),
      }))
    }
    if (activeJob) {
      localStorage.setItem("haruki_inherit_job", JSON.stringify({ jobId, userId: "toolbox-test", createdAt: Date.now(), codeAcknowledged: false }))
    }
  }, { legacyInherit: extra.legacyInherit ?? false, activeJob: extra.activeJob ?? false, jobId: JOB_ID })
}

type ApiHandler = (route: Route, url: URL, method: string) => Promise<void> | void

interface VaultMock {
  entries: Record<string, unknown>[]
  initialized: boolean
}

/** Routes the job and vault endpoints; `extra` answers first and returns true when it handled the call. */
async function mockApi(page: Page, options: { snapshot?: () => unknown; vault?: VaultMock; extra?: ApiHandler } = {}) {
  const calls: { method: string; path: string; body: unknown }[] = []
  const vault = options.vault ?? { entries: [], initialized: true }
  await page.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.host !== API_HOST) return route.abort()
    const method = request.method()
    const path = url.pathname
    let body: unknown = null
    try {
      body = request.postDataJSON()
    } catch {
      body = request.postData()
    }
    calls.push({ method, path, body })
    const handled = options.extra?.(route, url, method)
    if (handled) {
      await handled
      return
    }
    if (path === "/api/inherit/vault/key") {
      return route.fulfill(envelope({ initialized: vault.initialized, kind: "password", key_version: 1 }))
    }
    if (path === "/api/inherit/vault/entries" && method === "GET") {
      return route.fulfill(envelope(vault.entries))
    }
    if (path === `/api/inherit/jobs/${JOB_ID}/ws-ticket`) {
      return route.fulfill(envelope({ ticket: "ticket-1", expires_in: 30 }))
    }
    if (path === `/api/inherit/jobs/${JOB_ID}` && method === "GET") {
      return route.fulfill(envelope(options.snapshot ? options.snapshot() : AWAITING()))
    }
    return route.abort()
  })
  return calls
}

async function fillForm(page: Page, password: string) {
  await page.locator("#inherit-id").fill("ABCDEFGH12345678")
  await page.locator("#inherit-password").fill(password)
}

test.describe("transfer-code upload", () => {
  test("asks to sign in first", async ({ page }) => {
    await page.route("**/*", (route) => new URL(route.request().url()).host === "127.0.0.1:4173" ? route.continue() : route.abort())
    await page.goto("/upload-data?tab=inherit")
    await expect(page.getByTestId("inherit-login-required")).toBeVisible()
    await expect(page.locator("#inherit-id")).toHaveCount(0)
  })

  test("drops the old remembered code and validates the reuse password", async ({ page }) => {
    await signIn(page, { legacyInherit: true })
    const calls = await mockApi(page, {
      extra: (route, url, method) => {
        if (url.pathname === "/api/inherit/jobs" && method === "POST") {
          return route.fulfill({ ...envelope({ job_id: JOB_ID, job: job("running", { bootstrap: "running" }) }, 202, "job created") })
        }
      },
    })
    await page.routeWebSocket(/\/api\/inherit\/jobs\/.+\/ws/, (ws) => {
      ws.send(JSON.stringify({ type: "snapshot", job: job("running", { bootstrap: "running" }) }))
    })
    await page.goto("/upload-data?tab=inherit")
    await expect(page.locator("#inherit-id")).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem("haruki_inherit"))).toBeNull()

    // No "remember" option and no JP-disabled notice any more.
    await expect(page.getByText(/记住引继信息|remember transfer info/i)).toHaveCount(0)
    await expect(page.locator("#inherit-id")).toBeEnabled()

    // "Keep this password" needs 8-16 printable ASCII characters.
    await fillForm(page, "short")
    await expect(page.getByTestId("inherit-reuse-blocked")).toBeVisible()
    await page.getByRole("radio", { name: /沿用本次密码|Keep this password/ }).check()
    await page.locator('button[form="upload-data-inherit-form"]').click()
    await expect(page.locator("#inherit-password-error")).toBeVisible()
    expect(calls.some((call) => call.path === "/api/inherit/jobs")).toBe(false)

    await page.getByRole("radio", { name: /随机生成|Generate a random one/ }).check()
    await page.locator('button[form="upload-data-inherit-form"]').click()
    await expect(page.getByTestId("inherit-job")).toBeVisible()
    const create = calls.find((call) => call.path === "/api/inherit/jobs")
    expect(create?.body).toEqual({
      server: "jp",
      upload_type: "suite",
      inherit_id: "ABCDEFGH12345678",
      inherit_password: "short",
      new_password_mode: "random",
    })
    // Only the job id is remembered, never the code.
    const stored = await page.evaluate(() => localStorage.getItem("haruki_inherit_job"))
    expect(stored).toContain(JOB_ID)
    expect(stored).not.toContain("ABCDEFGH12345678")
    expect(stored).not.toContain("short")
  })

  test("follows the job over the socket, confirms, and keeps the new code after a later failure", async ({ page }) => {
    await signIn(page, { activeJob: true })
    await mockApi(page, {
      vault: { initialized: true, entries: [] },
    })
    const confirmFrames: unknown[] = []
    await page.routeWebSocket(/\/api\/inherit\/jobs\/.+\/ws/, (ws: WebSocketRoute) => {
      ws.send(JSON.stringify({ type: "snapshot", job: AWAITING() }))
      ws.onMessage((raw) => {
        const frame = JSON.parse(String(raw)) as Record<string, unknown>
        if (frame.type !== "confirm") return
        confirmFrames.push(frame)
        if (!frame.previous_password) {
          ws.send(JSON.stringify({ type: "error", action: "confirm", code: "vault_password_changed", message: "改过密码" }))
          return
        }
        ws.send(JSON.stringify({ type: "ack", action: "confirm", job: job("running", { bootstrap: "done", preview: "done", awaiting_confirm: "done" }, { preview: PREVIEW }) }))
        ws.send(JSON.stringify({ type: "event", event: { step: "issue_new_code", status: "done", at: new Date().toISOString() }, job: AFTER_CODE() }))
        setTimeout(() => {
          ws.send(JSON.stringify({ type: "event", event: { step: "fetch_suite", status: "failed", error_code: "fetch_failed", at: new Date().toISOString() }, job: FAILED_AFTER_CODE() }))
          ws.close({ code: 1000 })
        }, 300)
      })
    })

    // A followed job opens the inherit tab by itself.
    await page.goto("/upload-data")
    const panel = page.getByTestId("inherit-job")
    await expect(panel).toBeVisible()
    await expect(page.getByTestId("inherit-confirm")).toBeVisible()
    await expect(page.getByTestId("inherit-preview-nickname")).toHaveText("Miku")
    await expect(page.getByText("16*************363")).toBeVisible()
    await expect(page.getByTestId("inherit-restriction")).toContainText(/2/)
    await expect(page.getByTestId("inherit-job-connection")).toHaveAttribute("data-state", "live")
    await expect(page.locator('[data-step="bootstrap"] [data-substep="cookies"]')).toHaveAttribute("data-status", "done")

    // The Toolbox password is required…
    await page.getByRole("button", { name: /确认并执行引继|Confirm and transfer/ }).click()
    await expect(page.locator("#inherit-confirm-secret-error")).toBeVisible()

    // …and a changed password asks for the previous one once.
    await page.locator("#inherit-confirm-secret").fill("new-password")
    await page.getByRole("button", { name: /确认并执行引继|Confirm and transfer/ }).click()
    await expect(page.locator("#inherit-confirm-previous")).toBeVisible()
    await page.locator("#inherit-confirm-previous").fill("old-password")
    await page.getByRole("button", { name: /确认并执行引继|Confirm and transfer/ }).click()

    const code = page.getByTestId("inherit-new-code")
    await expect(code).toBeVisible()
    await expect(page.getByTestId("inherit-job-code-id")).toHaveText(NEW_CODE.inherit_id)
    await expect(page.getByTestId("inherit-job-code-password")).toHaveText(NEW_CODE.password)
    expect(confirmFrames).toEqual([
      { type: "confirm", password: "new-password" },
      { type: "confirm", password: "new-password", previous_password: "old-password" },
    ])

    // The fetch fails afterwards: the code stays, with the failure next to it.
    await expect(panel).toHaveAttribute("data-job-status", "failed")
    await expect(page.getByTestId("inherit-job-error")).toHaveAttribute("data-code", "fetch_failed")
    await expect(page.getByTestId("inherit-code-validity")).toHaveAttribute("data-validity", "used")
    await expect(page.getByTestId("inherit-job-code-id")).toHaveText(NEW_CODE.inherit_id)
    await expect(page.locator('[data-step="fetch_suite"]')).toHaveAttribute("data-status", "failed")

    // Leaving needs the acknowledgement first.
    const startNew = page.getByRole("button", { name: /开始新的上传|Start a new upload/ })
    await expect(startNew).toHaveAttribute("aria-disabled", "true")
    await page.getByRole("button", { name: /我已记下|I have written it down/ }).click()
    await expect(startNew).not.toHaveAttribute("aria-disabled", "true")
    await startNew.click()
    await expect(page.locator("#inherit-id")).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem("haruki_inherit_job"))).toBeNull()
  })

  for (const scenario of [
    { name: "at the confirm step", snapshot: AWAITING, visible: "inherit-confirm" },
    { name: "with its new code", snapshot: AFTER_CODE, visible: "inherit-new-code" },
  ] as const) {
    test(`resumes the running job named by job_already_running ${scenario.name}`, async ({ page }) => {
      await signIn(page)
      const calls = await mockApi(page, {
        snapshot: scenario.snapshot,
        extra: (route, url, method) => {
          if (url.pathname === "/api/inherit/jobs" && method === "POST") {
            return route.fulfill(envelope({ code: "job_already_running", job_id: JOB_ID }, 409, "你已有一个进行中的引继任务"))
          }
        },
      })
      await page.routeWebSocket(/\/api\/inherit\/jobs\/.+\/ws/, (ws) => {
        ws.send(JSON.stringify({ type: "snapshot", job: scenario.snapshot() }))
      })

      await page.goto("/upload-data?tab=inherit")
      await fillForm(page, "Passw0rd12")
      await page.locator('button[form="upload-data-inherit-form"]').click()

      await expect(page.getByTestId("inherit-job")).toBeVisible()
      await expect(page.getByTestId(scenario.visible)).toBeVisible()
      await expect(page.getByText(/你已有一个进行中的引继任务，已为你恢复|You already have a transfer upload in progress; it has been resumed/)).toBeVisible()
      await expect(page.getByTestId("inherit-job-connection")).toHaveAttribute("data-state", "live")
      expect(calls.some((call) => call.method === "GET" && call.path === `/api/inherit/jobs/${JOB_ID}`)).toBe(true)
      // The resumed job is remembered like a created one: its id only.
      const stored = await page.evaluate(() => localStorage.getItem("haruki_inherit_job"))
      expect(stored).toContain(JOB_ID)
      expect(stored).not.toContain("ABCDEFGH12345678")
      expect(stored).not.toContain("Passw0rd12")
    })
  }

  test("keeps the refusal when an older backend does not name the running job", async ({ page }) => {
    await signIn(page)
    const calls = await mockApi(page, {
      extra: (route, url, method) => {
        if (url.pathname === "/api/inherit/jobs" && method === "POST") {
          return route.fulfill(problem(409, "job_already_running", "你已有一个进行中的引继任务"))
        }
      },
    })

    await page.goto("/upload-data?tab=inherit")
    await fillForm(page, "Passw0rd12")
    await page.locator('button[form="upload-data-inherit-form"]').click()

    await expect(page.getByText(/请先完成或取消它|finish or cancel it/i)).toBeVisible()
    await expect(page.getByTestId("inherit-job")).toHaveCount(0)
    await expect(page.locator("#inherit-id")).toHaveValue("ABCDEFGH12345678")
    expect(calls.some((call) => call.path.startsWith(`/api/inherit/jobs/${JOB_ID}`))).toBe(false)
    expect(await page.evaluate(() => localStorage.getItem("haruki_inherit_job"))).toBeNull()
  })

  test("cancels over HTTP when the socket is unavailable", async ({ page }) => {
    await signIn(page, { activeJob: true })
    let cancelled = false
    const calls = await mockApi(page, {
      snapshot: () => (cancelled
        ? job("cancelled", { bootstrap: "done", preview: "done", awaiting_confirm: "failed" }, { preview: PREVIEW, error: { code: "cancelled", message: "已取消" } })
        : AWAITING()),
      extra: (route, url, method) => {
        if (url.pathname === `/api/inherit/jobs/${JOB_ID}/cancel` && method === "POST") {
          cancelled = true
          return route.fulfill(envelope(job("cancelled", { bootstrap: "done", preview: "done", awaiting_confirm: "failed" }, {
            preview: PREVIEW,
            error: { code: "cancelled", message: "已取消" },
          })))
        }
      },
    })
    // The socket refuses every connection: the page polls instead.
    await page.routeWebSocket(/\/api\/inherit\/jobs\/.+\/ws/, (ws) => ws.close({ code: 1011 }))

    await page.goto("/upload-data?tab=inherit")
    await expect(page.getByTestId("inherit-confirm")).toBeVisible()
    await page.getByRole("button", { name: /取消，不执行引继|Cancel, do not transfer/ }).click()
    await expect(page.getByTestId("inherit-job")).toHaveAttribute("data-job-status", "cancelled")
    await expect(page.getByTestId("inherit-code-validity")).toHaveAttribute("data-validity", "valid")
    expect(calls.some((call) => call.path.endsWith("/cancel") && call.method === "POST")).toBe(true)
  })

  test("shows, re-issues and destroys vault entries", async ({ page }) => {
    await signIn(page)
    const entry = {
      id: "entry-1",
      server: "jp",
      game_user_id_masked: "16*************363",
      job_id: JOB_ID,
      created_at: new Date().toISOString(),
      credential_expires_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
      has_code: true,
      code_issued_at: new Date().toISOString(),
      code_expires_at: new Date(Date.now() + 20 * 3_600_000).toISOString(),
      readable: true,
      pending: false,
    }
    const vault: VaultMock = { initialized: true, entries: [entry] }
    const calls = await mockApi(page, {
      vault,
      extra: (route, url, method) => {
        if (url.pathname === "/api/inherit/vault/entries/entry-1/reveal") {
          const body = route.request().postDataJSON() as { password?: string }
          if (body.password !== "toolbox-pw") return route.fulfill(problem(403, "password_invalid", "密码错误"))
          return route.fulfill(envelope({ inherit_id: "VAULTCODE1234567", password: "VaultPass99", code_expires_at: entry.code_expires_at }))
        }
        if (url.pathname === "/api/inherit/vault/entries/entry-1/reissue") {
          return route.fulfill(envelope({
            inherit_id: "REISSUED12345678",
            password: "Reissued0000",
            code_expires_at: entry.code_expires_at,
            warnings: [{ code: "vault_store_failed", message: "保存失败" }],
          }))
        }
        if (url.pathname === "/api/inherit/vault/entries/entry-1" && method === "DELETE") {
          vault.entries = []
          return route.fulfill(envelope(null, 200, "destroyed"))
        }
      },
    })

    await page.goto("/upload-data?tab=inherit")
    const row = page.getByTestId("inherit-vault-entry")
    await expect(row).toContainText("16*************363")

    await row.getByRole("button", { name: /查看引继码|Show code/ }).click()
    const dialog = page.getByRole("alertdialog")
    await dialog.locator("#inherit-vault-unlock-secret").fill("wrong")
    await dialog.getByRole("button", { name: /解锁|Unlock/ }).click()
    await expect(dialog.locator("#inherit-vault-unlock-secret-error")).toBeVisible()
    await dialog.locator("#inherit-vault-unlock-secret").fill("toolbox-pw")
    await dialog.getByRole("button", { name: /解锁|Unlock/ }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId("inherit-vault-code-entry-1-id")).toHaveText("VAULTCODE1234567")

    await row.getByRole("button", { name: /重新签发|Re-issue/ }).click()
    await dialog.locator("#inherit-vault-unlock-secret").fill("toolbox-pw")
    await dialog.getByRole("button", { name: /重新签发|Re-issue/ }).click()
    await expect(page.getByTestId("inherit-vault-code-entry-1-id")).toHaveText("REISSUED12345678")
    // The vault could not keep it: the card insists on writing it down.
    await expect(row.getByText(/立即记下这组引继码|Write this code down now/)).toBeVisible()
    const reissue = calls.find((call) => call.path.endsWith("/reissue"))
    expect(reissue?.body).toEqual({ password: "toolbox-pw", new_password_mode: "random" })

    await row.getByRole("button", { name: /我已在手机上恢复|I recovered it on my phone/ }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: /确认销毁|Destroy/ }).click()
    await expect(page.getByTestId("inherit-vault-entry")).toHaveCount(0)
    expect(calls.some((call) => call.method === "DELETE" && call.path === "/api/inherit/vault/entries/entry-1")).toBe(true)
  })
})
