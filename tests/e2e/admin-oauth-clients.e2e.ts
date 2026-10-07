import { expect, test, type Page } from "@playwright/test"

// The admin OAuth client page against a mocked backend that answers like the
// per-subject revocation and JSON Patch lifecycle do: an edit that switches a
// client to confidential returns a one-time clientSecret, disable / revoke-all
// report revocationComplete, and rotate-secret refuses public clients with
// 400 updatedData.code=public_client_has_no_secret.
const APP_HOST = "127.0.0.1:4173"
const CLIENTS_PATH = "/api/admin/oauth-clients"
const ADMIN_USER_ID = "admin-1"

type MockClient = {
  clientId: string
  name: string
  clientType: "public" | "confidential"
  active: boolean
}

type ApiCall = {
  method: string
  path: string
  body: unknown
}

type MockReply = {
  status: number
  message: string
  updatedData?: unknown
}

const PUBLIC_CLIENT: MockClient = { clientId: "cli-public", name: "Public CLI", clientType: "public", active: true }
const CONFIDENTIAL_CLIENT: MockClient = { clientId: "bot-confidential", name: "Confidential Bot", clientType: "confidential", active: true }

function toListItem(client: MockClient) {
  return {
    ...client,
    createdAt: "2026-10-01T00:00:00Z",
    redirectUris: [`https://${client.clientId}.example/callback`],
    postLogoutRedirectUris: [],
    scopes: ["user:read"],
    usage: { totalAuthorizations: 0, activeAuthorizations: 0, last30DaysAuthorizations: 0 },
  }
}

/**
 * Opens the page as a super admin. `clients` is read on every list request, so
 * a test can change it to model what the backend holds after an action.
 * `reply` answers every other admin OAuth client call.
 */
async function openOAuthClientAdmin(
  page: Page,
  clients: { current: MockClient[] },
  reply: (call: ApiCall) => MockReply | undefined,
) {
  const calls: ApiCall[] = []
  // Time runs normally until a test fast-forwards it past a toast's lifetime.
  await page.clock.install()
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Super admin",
      userId,
      role: "super_admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  }, ADMIN_USER_ID)
  await page.addInitScript(() => {
    // Records every toast that is ever rendered, as "type:text". Sonner removes
    // a toast after 4 s, so a toast that is gone may still have been shown.
    const raised: string[] = []
    Object.assign(window, { __raisedToasts: raised })
    new MutationObserver(() => {
      for (const element of document.querySelectorAll("[data-sonner-toast]")) {
        const entry = `${element.getAttribute("data-type")}:${element.textContent ?? ""}`
        if (!raised.includes(entry)) {
          raised.push(entry)
        }
      }
    }).observe(document, { childList: true, subtree: true, characterData: true })
  })
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) {
      // A settled settings sync keeps its retry warning toast out of the assertions.
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", updatedData: { userId: ADMIN_USER_ID, name: "Super admin", role: "super_admin" } }),
      })
    }
    if (!url.pathname.startsWith(CLIENTS_PATH)) {
      return route.abort()
    }
    const call: ApiCall = { method: request.method(), path: url.pathname, body: request.postDataJSON() }
    calls.push(call)
    const answer: MockReply | undefined = call.method === "GET" && call.path === CLIENTS_PATH
      ? { status: 200, message: "success", updatedData: { items: clients.current.map(toListItem), total: clients.current.length } }
      : reply(call)
    if (!answer) {
      return route.abort()
    }
    return route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer) })
  })

  await page.goto("/admin/oauth-clients")
  // First visit to the admin chunk on a cold dev server: allow for the transform.
  await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId)).toBeVisible({ timeout: 30_000 })
  return calls
}

function clientCard(page: Page, clientId: string) {
  return page.locator("article").filter({ has: page.getByText(clientId, { exact: true }) })
}

async function openClientMenu(page: Page, clientId: string) {
  await clientCard(page, clientId).getByRole("button", { name: /^(打开菜单|Open menu)$/ }).click()
  return page.getByRole("menu")
}

type ToastType = "success" | "warning" | "error"
type ToastRecorder = { __raisedToasts: string[] }

function toast(page: Page, type: ToastType, text: RegExp) {
  return page.locator(`[data-sonner-toast][data-type="${type}"]`).filter({ hasText: text })
}

/**
 * The toasts of `type` matching `text` that were ever rendered on the page.
 * Absence checks use this record, not `expect(toast(...)).toHaveCount(0)`:
 * that assertion retries, so it would pass once sonner removes a toast that
 * was shown. Call this after the action has finished. Sonner mounts a toast
 * on the tick after `toast()`, so a short wait covers the render.
 */
async function raisedToasts(page: Page, type: ToastType, text: RegExp) {
  await page.waitForTimeout(300)
  const raised = await page.evaluate(() => (window as unknown as ToastRecorder).__raisedToasts)
  return raised.filter((entry) => entry.startsWith(`${type}:`) && text.test(entry.slice(type.length + 1)))
}

/**
 * Moves the page clock past sonner's 4 s default toast lifetime, then waits
 * out the exit animation (200 ms) of any toast that expired.
 */
async function outlastDefaultToastLifetime(page: Page) {
  // Sonner pauses its timers while the pointer is over the toasts (top right).
  await page.mouse.move(0, (page.viewportSize()?.height ?? 720) - 1)
  await page.clock.fastForward(10_000)
  await page.waitForTimeout(500)
}

const SAVED_TOAST = /已保存|Saved/
const DISABLED_TOAST = /已禁用|Disabled/
const REVOKED_ALL_TOAST = /已撤销所有授权|All authorizations revoked/
const DISABLE_WARNING = /客户端已禁用，但部分授权未能撤销|Client disabled, but some grants were not revoked/
const REVOKE_WARNING = /授权仅部分撤销|Authorizations only partly revoked/

const EDIT_BUTTON = /^(编辑|Edit)$/
const CLOSE_BUTTON = /^(关闭|Close)$/
const ROTATE_ITEM = /^(轮换 Secret|Rotate secret)$/
const REVOKE_ALL_ITEM = /^(撤销全部授权|Revoke all authorizations)$/

test.describe("admin OAuth clients", () => {
  test.describe.configure({ timeout: 60_000 })

  test("offers secret rotation for confidential clients only", async ({ page }) => {
    await openOAuthClientAdmin(page, { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }, () => undefined)

    const publicMenu = await openClientMenu(page, PUBLIC_CLIENT.clientId)
    await expect(publicMenu.getByRole("menuitem", { name: REVOKE_ALL_ITEM })).toBeVisible()
    await expect(publicMenu.getByRole("menuitem", { name: ROTATE_ITEM })).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(publicMenu).toBeHidden()

    const confidentialMenu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await expect(confidentialMenu.getByRole("menuitem", { name: ROTATE_ITEM })).toBeVisible()
  })

  test("shows the one-time secret when an edit switches a client to confidential", async ({ page }) => {
    const clients = { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }
    const calls = await openOAuthClientAdmin(page, clients, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${PUBLIC_CLIENT.clientId}`) {
        clients.current = [{ ...PUBLIC_CLIENT, clientType: "confidential" }, CONFIDENTIAL_CLIENT]
        return {
          status: 200,
          message: "oauth client updated",
          updatedData: { ...toListItem(clients.current[0]), clientSecret: "s3cr3t-issued-once" },
        }
      }
      return undefined
    })

    await clientCard(page, PUBLIC_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON }).click()
    const editDialog = page.getByRole("dialog", { name: /编辑OAuth客户端|Edit OAuth client/ })
    await editDialog.getByRole("combobox", { name: /客户端类型|Client type/ }).click()
    await page.getByRole("option", { name: /^Confidential/ }).click()
    await editDialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    const secretDialog = page.getByRole("alertdialog", { name: /凭证生成成功|Credential generated/ })
    await expect(secretDialog).toContainText("s3cr3t-issued-once")
    await expect(editDialog).toBeHidden()
    const update = calls.find((call) => call.method === "PUT")
    expect(update?.body).toMatchObject({ clientType: "confidential" })

    // The list reloads behind the dialog; the secret replaces the plain "saved" toast, as on create.
    await expect(clientCard(page, PUBLIC_CLIENT.clientId)).toContainText(/Confidential/)
    expect(await raisedToasts(page, "success", SAVED_TOAST)).toEqual([])
  })

  test("keeps the saved toast for an edit that issues no secret", async ({ page }) => {
    await openOAuthClientAdmin(page, { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${CONFIDENTIAL_CLIENT.clientId}`) {
        return { status: 200, message: "oauth client updated", updatedData: toListItem(CONFIDENTIAL_CLIENT) }
      }
      return undefined
    })

    await clientCard(page, CONFIDENTIAL_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON }).click()
    const editDialog = page.getByRole("dialog", { name: /编辑OAuth客户端|Edit OAuth client/ })
    await editDialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    await expect(toast(page, "success", SAVED_TOAST)).toBeVisible()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
  })

  test("warns when disabling a client leaves grants behind", async ({ page }) => {
    const clients = { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }
    const calls = await openOAuthClientAdmin(page, clients, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${CONFIDENTIAL_CLIENT.clientId}/active`) {
        clients.current = [PUBLIC_CLIENT, { ...CONFIDENTIAL_CLIENT, active: false }]
        return {
          status: 200,
          message: "oauth client disabled, but some grants could not be revoked",
          updatedData: {
            clientId: CONFIDENTIAL_CLIENT.clientId,
            active: false,
            revokedSubjects: 4,
            failedSubjects: ["u-3"],
            revocationComplete: false,
          },
        }
      }
      return undefined
    })

    const menu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await menu.getByRole("menuitem", { name: /^(禁用客户端|Disable client)$/ }).click()

    const warning = toast(page, "warning", DISABLE_WARNING)
    await expect(warning).toBeVisible()
    await expect(warning).toContainText(/有 1 个用户标识（subject）撤销失败|1 subject \(user identity\) could not be revoked/)
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({ active: false })

    // The success toast would follow the list reload. Once the reload shows the
    // client as disabled and the row actions are enabled again, the action is over.
    await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId)).toContainText(/禁用|Disabled/)
    await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON })).toBeEnabled()
    expect(await raisedToasts(page, "success", DISABLED_TOAST)).toEqual([])

    // The warning outlasts sonner's default lifetime and goes only when closed.
    await outlastDefaultToastLifetime(page)
    await expect(warning).toBeVisible()
    await warning.getByRole("button", { name: CLOSE_BUTTON }).click()
    await expect(warning).toHaveCount(0)
  })

  test("keeps the success toast when disabling revokes everything", async ({ page }) => {
    const clients = { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }
    await openOAuthClientAdmin(page, clients, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${CONFIDENTIAL_CLIENT.clientId}/active`) {
        clients.current = [PUBLIC_CLIENT, { ...CONFIDENTIAL_CLIENT, active: false }]
        return {
          status: 200,
          message: "oauth client status updated",
          updatedData: { clientId: CONFIDENTIAL_CLIENT.clientId, active: false, revokedSubjects: 5, failedSubjects: [], revocationComplete: true },
        }
      }
      return undefined
    })

    const menu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await menu.getByRole("menuitem", { name: /^(禁用客户端|Disable client)$/ }).click()

    const success = toast(page, "success", DISABLED_TOAST)
    await expect(success).toBeVisible()
    expect(await raisedToasts(page, "warning", DISABLE_WARNING)).toEqual([])

    // Control for the warning tests: the same fast-forward removes a default toast.
    // The short timeout keeps real time under the 4 s lifetime, so only the
    // fast-forward can make this pass.
    await outlastDefaultToastLifetime(page)
    await expect(success).toHaveCount(0, { timeout: 1_000 })
  })

  test("warns when revoke-all only partly succeeds", async ({ page }) => {
    await openOAuthClientAdmin(page, { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }, (call) => {
      if (call.method === "POST" && call.path === `${CLIENTS_PATH}/${CONFIDENTIAL_CLIENT.clientId}/revoke`) {
        // Failed subjects the admin may not see are counted only in revocationComplete.
        return {
          status: 200,
          message: "oauth client authorizations revoked partially",
          updatedData: {
            clientId: CONFIDENTIAL_CLIENT.clientId,
            revokeAuthorizations: true,
            revokeTokens: true,
            revokedAuthorizations: 2,
            revokedTokens: 0,
            revokedSubjects: 4,
            failedSubjects: [],
            revocationComplete: false,
          },
        }
      }
      return undefined
    })

    const menu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await menu.getByRole("menuitem", { name: REVOKE_ALL_ITEM }).click()
    const confirm = page.getByRole("alertdialog", { name: /撤销全部授权|Revoke all authorizations/ })
    await confirm.getByRole("button", { name: /^(全部撤销|Revoke all)$/ }).click()

    const warning = toast(page, "warning", REVOKE_WARNING)
    await expect(warning).toBeVisible()
    await expect(warning).toContainText(/部分授权未能撤销|Some grants could not be revoked/)
    await expect(confirm).toBeHidden()
    await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON })).toBeEnabled()
    expect(await raisedToasts(page, "success", REVOKED_ALL_TOAST)).toEqual([])

    await outlastDefaultToastLifetime(page)
    await expect(warning).toBeVisible()
  })

  test("explains a rotate refused for a client that is now public", async ({ page }) => {
    const clients = { current: [PUBLIC_CLIENT, CONFIDENTIAL_CLIENT] }
    await openOAuthClientAdmin(page, clients, (call) => {
      if (call.method === "POST" && call.path === `${CLIENTS_PATH}/${CONFIDENTIAL_CLIENT.clientId}/rotate-secret`) {
        // Another admin made the client public after this list was loaded.
        clients.current = [PUBLIC_CLIENT, { ...CONFIDENTIAL_CLIENT, clientType: "public" }]
        return {
          status: 400,
          message: "public clients have no secret to rotate",
          updatedData: { code: "public_client_has_no_secret" },
        }
      }
      return undefined
    })

    const menu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await menu.getByRole("menuitem", { name: ROTATE_ITEM }).click()
    const confirm = page.getByRole("alertdialog", { name: /轮换客户端密钥|Rotate client secret/ })
    await confirm.getByRole("button", { name: /^(轮换|Rotate)$/ }).click()

    const error = toast(page, "error", /轮换失败|Rotate failed/)
    await expect(error).toBeVisible()
    await expect(error).toContainText(/如需 Secret，请把客户端类型改为 Confidential|To get one, change the client type to confidential/)
    await expect(confirm).toBeHidden()

    // The refreshed list shows the client as public, so the action is gone.
    await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId)).toContainText(/Public/)
    const refreshedMenu = await openClientMenu(page, CONFIDENTIAL_CLIENT.clientId)
    await expect(refreshedMenu.getByRole("menuitem", { name: REVOKE_ALL_ITEM })).toBeVisible()
    await expect(refreshedMenu.getByRole("menuitem", { name: ROTATE_ITEM })).toHaveCount(0)
  })
})
