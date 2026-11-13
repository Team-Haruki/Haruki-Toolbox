import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test, type Page, type Request } from "@playwright/test"

// The identity-settings page draws every group of the Kratos settings flow
// inside the one Kratos form. Two things follow from that and are checked
// here: a removal asks before it posts, and posts exactly the node a direct
// click would have posted; and Enter in a group's input presses that group's
// own button, never the first submit button of the page.

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kratos")
const KRATOS_HOST = "127.0.0.1:9"

const SIGNED_IN_USER = {
  name: "Kanade",
  userId: "toolbox-e2e",
  gameAccountBindings: [],
  sessionToken: "e2e-token",
  tokenExpiration: 4_102_444_800,
}

async function openSettings(page: Page, fixture: string): Promise<Request[]> {
  const appOrigin = new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:4173").origin
  const body = readFileSync(join(FIXTURE_DIR, `${fixture}.json`), "utf8")
  const posts: Request[] = []
  await page.addInitScript((user) => {
    sessionStorage.setItem("user", JSON.stringify(user))
  }, SIGNED_IN_USER)
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === appOrigin) {
      return route.continue()
    }
    if (url.host !== KRATOS_HOST) {
      return route.abort()
    }
    if (url.pathname === "/self-service/settings/flows") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": appOrigin, "access-control-allow-credentials": "true" },
        body,
      })
    }
    if (url.pathname === "/self-service/settings" && request.method() === "POST") {
      posts.push(request)
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>kratos-settings-posted</title>" })
    }
    // Kratos' webauthn.js: served empty, so its trigger functions never exist.
    if (url.pathname.endsWith(".js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
    }
    return route.abort()
  })
  await page.goto("/user/settings?flow=e2e-flow&section=mfa")
  await expect(page.locator("[data-kratos-group='passkey']")).toBeVisible()
  return posts
}

function formBody(request: Request): URLSearchParams {
  return new URLSearchParams(request.postData() ?? "")
}

test("removing a passkey asks first and posts nothing when cancelled", async ({ page }) => {
  const posts = await openSettings(page, "settings-keys-registered")

  await page.getByRole("button", { name: "移除通行密钥「kanade@example.com」" }).click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("移除通行密钥「kanade@example.com」？")

  await dialog.getByRole("button", { name: "取消" }).click()
  await expect(dialog).toBeHidden()
  await expect(page).not.toHaveTitle("kratos-settings-posted")
  expect(posts).toHaveLength(0)
})

test("confirming the removal posts the passkey node with the CSRF token", async ({ page }) => {
  const posts = await openSettings(page, "settings-keys-registered")

  await page.getByRole("button", { name: "移除通行密钥「kanade@example.com」" }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "移除", exact: true }).click()
  await expect(page).toHaveTitle("kratos-settings-posted")

  expect(posts).toHaveLength(1)
  const body = formBody(posts[0])
  expect(body.get("passkey_remove")).toBe("6b616e6164652d706b")
  expect(body.get("csrf_token")).toBe("e2e-csrf")
  // Only the clicked button is posted: no other removal, no method.
  expect(body.has("webauthn_remove")).toBe(false)
  expect(body.has("totp_unlink")).toBe(false)
  expect(body.has("lookup_secret_disable")).toBe(false)
  expect(body.has("method")).toBe(false)
})

test("Enter in the security key name presses its own add button, not a removal", async ({ page }) => {
  const posts = await openSettings(page, "settings-keys-registered")

  const name = page.getByRole("textbox", { name: "安全密钥名称" })
  await name.fill("Spare key")
  await name.press("Enter")

  // The add button runs Kratos' webauthn.js, which the mock serves empty.
  await expect(page.getByText("通行密钥暂时不可用，请使用其他方式继续")).toBeVisible()
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(page).not.toHaveTitle("kratos-settings-posted")
  expect(posts).toHaveLength(0)
})

test("Enter in the authenticator code posts the authenticator method", async ({ page }) => {
  const posts = await openSettings(page, "settings-lookup-generated")

  const code = page.getByRole("textbox", { name: "动态验证码" })
  await code.fill("123456")
  await code.press("Enter")
  await expect(page).toHaveTitle("kratos-settings-posted")

  expect(posts).toHaveLength(1)
  const body = formBody(posts[0])
  expect(body.get("method")).toBe("totp")
  expect(body.get("totp_code")).toBe("123456")
  expect(body.has("lookup_secret_confirm")).toBe(false)
})
