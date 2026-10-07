import { expect, test, type Page } from "@playwright/test"

// The admin OAuth client page against a mocked backend that answers like the
// per-subject revocation and JSON Patch lifecycle do: an edit that switches a
// client to confidential returns a one-time clientSecret, disable / revoke-all
// report revocationComplete, rotate-secret refuses public clients with
// 400 updatedData.code=public_client_has_no_secret, and client create / update
// answer the grant and device policy rules with 400 updatedData.code.
const APP_HOST = "127.0.0.1:4173"
const CLIENTS_PATH = "/api/admin/oauth-clients"
const ADMIN_USER_ID = "admin-1"

type MockClient = {
  clientId: string
  name: string
  clientType: "public" | "confidential"
  active: boolean
  grantTypes?: string[]
  redirectUris?: string[]
  scopes?: string[]
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
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"
const DEVICE_CLIENT: MockClient = {
  clientId: "haruki-client",
  name: "Haruki Client",
  clientType: "public",
  active: true,
  grantTypes: [DEVICE_GRANT, "refresh_token"],
  redirectUris: [],
  scopes: ["user:read", "offline_access", "station:room:write"],
}

// Like the backend: clients without stored grant fields echo the defaults.
function toListItem(client: MockClient) {
  const grantTypes = client.grantTypes ?? ["authorization_code", "refresh_token"]
  return {
    ...client,
    createdAt: "2026-10-01T00:00:00Z",
    redirectUris: client.redirectUris ?? [`https://${client.clientId}.example/callback`],
    postLogoutRedirectUris: [],
    scopes: client.scopes ?? ["user:read"],
    grantTypes,
    deviceEnabled: grantTypes.includes(DEVICE_GRANT),
    devicePolicy: { firstParty: false, allowWrite: false, maxCodesPer10m: 60 },
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

const DEVICE_BADGE = /^(设备码|Device code)$/
const CREATED_TOAST = /OAuth客户端已创建|OAuth client created/

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

  test("marks device clients in the list", async ({ page }) => {
    await openOAuthClientAdmin(page, { current: [DEVICE_CLIENT, CONFIDENTIAL_CLIENT] }, () => undefined)

    await expect(clientCard(page, DEVICE_CLIENT.clientId).getByText(DEVICE_BADGE)).toBeVisible()
    // A client listed without grantTypes is an authorization code client.
    await expect(clientCard(page, CONFIDENTIAL_CLIENT.clientId).getByText(DEVICE_BADGE)).toHaveCount(0)
  })

  test("creates a device-only client without redirect URIs", async ({ page }) => {
    const clients = { current: [CONFIDENTIAL_CLIENT] }
    const calls = await openOAuthClientAdmin(page, clients, (call) => {
      if (call.method === "POST" && call.path === CLIENTS_PATH) {
        clients.current = [DEVICE_CLIENT, CONFIDENTIAL_CLIENT]
        return { status: 200, message: "oauth client created", updatedData: { ...toListItem(DEVICE_CLIENT), clientSecret: "" } }
      }
      return undefined
    })

    await page.getByRole("button", { name: /^(创建客户端|Create client)$/ }).click()
    const dialog = page.getByRole("dialog", { name: /创建OAuth客户端|Create OAuth client/ })
    await dialog.getByLabel(/客户端ID|Client ID/).fill(DEVICE_CLIENT.clientId)
    await dialog.getByLabel(/^(客户端名称|Client name)$/).fill(DEVICE_CLIENT.name)
    await dialog.getByRole("combobox", { name: /客户端类型|Client type/ }).click()
    await page.getByRole("option", { name: /^Public/ }).click()

    // Device policy controls appear with the device grant.
    const maxCodes = dialog.getByLabel(/每 10 分钟设备码上限|Device codes per 10 minutes/)
    await expect(maxCodes).toHaveCount(0)
    await dialog.getByRole("button", { name: /authorization_code/ }).click()
    await dialog.getByRole("button", { name: /device_code/ }).click()
    await expect(maxCodes).toHaveValue("60")
    await maxCodes.fill("120")
    await expect(dialog.getByText(/仅设备码客户端可以留空|device-only clients can leave this empty/)).toBeVisible()
    // firstParty only applies to confidential clients; allowWrite needs game-data:write.
    await expect(dialog.getByRole("switch", { name: /官方客户端|First-party client/ })).toBeDisabled()
    await expect(dialog.getByRole("switch", { name: /game-data:write/ })).toBeDisabled()
    await dialog.getByRole("button", { name: /offline_access/ }).click()
    await dialog.getByRole("button", { name: /station:room:write/ }).click()
    await expect(dialog.getByRole("button", { name: /station:room:write/ })).toHaveAttribute("aria-pressed", "true")

    await dialog.getByRole("button", { name: /^(创建|Create)$/ }).click()

    await expect(toast(page, "success", CREATED_TOAST)).toBeVisible()
    await expect(dialog).toBeHidden()
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({
      clientId: DEVICE_CLIENT.clientId,
      name: DEVICE_CLIENT.name,
      clientType: "public",
      redirectUris: [],
      postLogoutRedirectUris: [],
      scopes: ["user:read", "offline_access", "station:room:write"],
      grantTypes: [DEVICE_GRANT, "refresh_token"],
      devicePolicy: { firstParty: false, allowWrite: false, maxCodesPer10m: 120 },
    })
    await expect(clientCard(page, DEVICE_CLIENT.clientId).getByText(DEVICE_BADGE)).toBeVisible()
  })

  test("checks the device grant rules before sending", async ({ page }) => {
    const calls = await openOAuthClientAdmin(page, { current: [CONFIDENTIAL_CLIENT] }, () => undefined)

    await page.getByRole("button", { name: /^(创建客户端|Create client)$/ }).click()
    const dialog = page.getByRole("dialog", { name: /创建OAuth客户端|Create OAuth client/ })
    await dialog.getByLabel(/客户端ID|Client ID/).fill("device-without-user-read")
    await dialog.getByLabel(/^(客户端名称|Client name)$/).fill("No user:read")
    await dialog.getByRole("button", { name: /authorization_code/ }).click()
    await dialog.getByRole("button", { name: /device_code/ }).click()
    await dialog.getByRole("button", { name: /user:read/ }).click()
    await dialog.getByRole("button", { name: /game-data:read/ }).click()
    await dialog.getByRole("button", { name: /^(创建|Create)$/ }).click()

    await expect(toast(page, "error", /设备码客户端须登记 user:read|Device code clients must register user:read/)).toBeVisible()
    await expect(dialog).toBeVisible()
    expect(calls.filter((call) => call.method === "POST")).toEqual([])
  })

  test("keeps the grants of an untouched device-only client on edit", async ({ page }) => {
    const calls = await openOAuthClientAdmin(page, { current: [DEVICE_CLIENT, CONFIDENTIAL_CLIENT] }, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${DEVICE_CLIENT.clientId}`) {
        return { status: 200, message: "oauth client updated", updatedData: toListItem(DEVICE_CLIENT) }
      }
      return undefined
    })

    await clientCard(page, DEVICE_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON }).click()
    const editDialog = page.getByRole("dialog", { name: /编辑OAuth客户端|Edit OAuth client/ })
    await expect(editDialog.getByRole("button", { name: /device_code/ })).toHaveAttribute("aria-pressed", "true")
    await expect(editDialog.getByRole("button", { name: /authorization_code/ })).toHaveAttribute("aria-pressed", "false")
    await editDialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    await expect(toast(page, "success", SAVED_TOAST)).toBeVisible()
    // Omitted grantTypes / devicePolicy keep the registered ones on the backend.
    const update = calls.find((call) => call.method === "PUT")?.body
    expect(update).toMatchObject({ clientType: "public", redirectUris: [], postLogoutRedirectUris: [] })
    expect(update).not.toHaveProperty("grantTypes")
    expect(update).not.toHaveProperty("devicePolicy")
  })

  test("explains a refused device policy in the admin's language", async ({ page }) => {
    await openOAuthClientAdmin(page, { current: [DEVICE_CLIENT, CONFIDENTIAL_CLIENT] }, (call) => {
      if (call.method === "PUT" && call.path === `${CLIENTS_PATH}/${DEVICE_CLIENT.clientId}`) {
        return {
          status: 400,
          message: "devicePolicy.maxCodesPer10m must be between 1 and 600",
          updatedData: { code: "invalid_device_policy" },
        }
      }
      return undefined
    })

    await clientCard(page, DEVICE_CLIENT.clientId).getByRole("button", { name: EDIT_BUTTON }).click()
    const editDialog = page.getByRole("dialog", { name: /编辑OAuth客户端|Edit OAuth client/ })
    await editDialog.getByLabel(/每 10 分钟设备码上限|Device codes per 10 minutes/).fill("30")
    await editDialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    const error = toast(page, "error", /保存失败|Save failed/)
    await expect(error).toBeVisible()
    await expect(error).toContainText(/每 10 分钟设备码上限须为 1–600 之间的整数|Device codes per 10 minutes must be a whole number/)
    await expect(editDialog).toBeVisible()
  })
})
