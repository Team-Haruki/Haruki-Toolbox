import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test, type Page } from "@playwright/test"

// Every Kratos-driven page, in every state the fixtures capture, must render
// in the user's language. The fixtures under fixtures/kratos are real
// Kratos v25.4.0 responses (captured from a local Kratos running the
// production methods: password, code, passkey, oidc google+apple, totp,
// lookup_secret, webauthn); the few states that need time or hardware are
// synthesized from them with the message shapes of ory/kratos text/*.go and
// say so in their `_note`.

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kratos")
const KRATOS_HOST = "127.0.0.1:9"

function fixture(name: string): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.json`), "utf8")
}

type FlowType = "login" | "registration" | "recovery" | "verification" | "settings"

interface KratosState {
  name: string
  /** Page path (with query) the browser opens. */
  path: string
  /** Fixture served for the flow or error lookup. */
  fixture: string
  flowType?: FlowType
  /** Settings requires a signed-in toolbox user. */
  signedIn?: boolean
  /** Text that proves the state rendered (a localized Kratos message or label). */
  expectText: RegExp
}

const flowPage: Record<FlowType, string> = {
  login: "/user/login",
  registration: "/user/register",
  recovery: "/user/recovery",
  verification: "/user/verification",
  settings: "/user/settings",
}

function flowState(flowType: FlowType, fixtureName: string, expectText: RegExp, query = ""): KratosState {
  return {
    name: fixtureName + (query ? `#${query.replace(/[^a-z]+/g, "-")}` : ""),
    path: `${flowPage[flowType]}?flow=e2e-flow${query ? `&${query}` : ""}`,
    fixture: fixtureName,
    flowType,
    signedIn: flowType === "settings",
    expectText,
  }
}

function errorState(fixtureName: string, expectText: RegExp): KratosState {
  return { name: fixtureName, path: "/user/error?id=e2e-error", fixture: fixtureName, expectText }
}

const KRATOS_STATES: KratosState[] = [
  flowState("login", "login-initial", /使用通行密钥登录/),
  flowState("login", "login-wrong-password", /邮箱或密码不正确/),
  flowState("login", "login-empty", /请填写邮箱/),
  flowState("login", "login-unknown-account", /邮箱或密码不正确/),
  flowState("login", "login-oidc-access-denied", /你取消了第三方账号授权/),
  flowState("login", "login-oidc-link", /添加为它的另一种登录方式/),
  flowState("login", "login-expired", /登录页面停留时间过长/),
  flowState("login", "login-refresh", /请再次验证身份/),
  flowState("login", "login-aal2", /请完成第二步验证/),
  flowState("login", "login-aal2-totp-wrong", /动态验证码不正确/),
  flowState("login", "login-aal2-lookup-wrong", /备用恢复码不正确/),
  flowState("registration", "registration-initial", /使用 Google 注册/),
  flowState("registration", "registration-invalid-email", /邮箱格式不正确/),
  flowState("registration", "registration-choose-credentials", /使用通行密钥注册/),
  flowState("registration", "registration-password-too-short", /密码太短，至少需要 8 个字符/),
  flowState("registration", "registration-password-similar", /密码与邮箱过于相似/),
  flowState("registration", "registration-password-breached", /数据泄露/),
  flowState("registration", "registration-duplicate", /这个邮箱已经注册过账号/),
  flowState("registration", "registration-duplicate-hints", /你可以使用密码或通行密钥登录/),
  flowState("registration", "registration-expired", /注册页面停留时间过长/),
  flowState("verification", "verification-initial", /发送验证码/),
  flowState("verification", "verification-sent-email", /重新发送验证码/),
  flowState("verification", "verification-wrong-code", /验证码无效或已使用/),
  flowState("verification", "verification-passed", /邮箱验证成功/),
  flowState("verification", "verification-expired", /验证页面停留时间过长/),
  flowState("recovery", "recovery-initial", /发送验证码/),
  flowState("recovery", "recovery-sent-email", /重新发送验证码/),
  flowState("recovery", "recovery-wrong-code", /验证码无效或已使用/),
  flowState("recovery", "recovery-resent", /找回密码验证码已发送/),
  flowState("recovery", "recovery-unknown-address", /找回密码验证码已发送/),
  flowState("recovery", "recovery-too-many-attempts", /尝试次数过多/),
  flowState("recovery", "recovery-expired", /找回密码页面停留时间过长/),
  flowState("settings", "settings-initial", /保存/, "section=profile"),
  flowState("settings", "settings-initial", /新密码/, "section=password"),
  flowState("settings", "settings-initial", /添加通行密钥/, "section=mfa"),
  flowState("settings", "settings-initial", /关联 Google 账号/, "section=oidc"),
  flowState("settings", "settings-profile-saved", /设置已保存/, "section=profile"),
  flowState("settings", "settings-profile-invalid", /请填写邮箱/, "section=profile"),
  flowState("settings", "settings-password-too-short", /密码太短/, "section=password"),
  flowState("settings", "settings-password-same", /新密码不能与当前密码相同/, "section=password"),
  flowState("settings", "settings-after-recovery", /账号已成功找回/, "section=password"),
  flowState("settings", "settings-lookup-generated", /确认并启用备用恢复码/, "section=mfa"),
  flowState("settings", "settings-lookup-confirmed", /停用备用恢复码/, "section=mfa"),
  flowState("settings", "settings-totp-wrong-code", /动态验证码不正确/, "section=mfa"),
  flowState("settings", "settings-totp-linked", /停用验证器 App/, "section=mfa"),
  flowState("settings", "settings-keys-registered", /移除通行密钥/, "section=mfa"),
  flowState("settings", "settings-oidc-linked", /解除关联 Google 账号/, "section=oidc"),
  flowState("settings", "settings-expired", /设置页面停留时间过长/, "section=profile"),
  errorState("error-csrf", /安全校验未通过/),
  errorState("error-stub-500", /内部错误/),
  errorState("error-session-already-available", /你已经登录了/),
  errorState("error-session-refresh-required", /重新验证身份/),
  errorState("error-flow-expired", /页面已过期/),
  errorState("error-oidc-state", /第三方账号登录没有完成/),
]

const SIGNED_IN_USER = {
  name: "Kanade",
  userId: "toolbox-e2e",
  gameAccountBindings: [],
  sessionToken: "e2e-token",
  tokenExpiration: 4_102_444_800,
}

function kratosJson(appOrigin: string, body: string) {
  return {
    status: 200,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": appOrigin,
      "access-control-allow-credentials": "true",
    },
    body,
  }
}

async function openState(page: Page, state: KratosState) {
  const appOrigin = new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:4173").origin
  if (state.signedIn) {
    await page.addInitScript((user) => {
      sessionStorage.setItem("user", JSON.stringify(user))
    }, SIGNED_IN_USER)
  }
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.origin === appOrigin) {
      return route.continue()
    }
    if (url.host === KRATOS_HOST) {
      if (state.flowType && url.pathname === `/self-service/${state.flowType}/flows`) {
        return route.fulfill(kratosJson(appOrigin, fixture(state.fixture)))
      }
      if (!state.flowType && url.pathname === "/self-service/errors") {
        return route.fulfill(kratosJson(appOrigin, fixture(state.fixture)))
      }
    }
    return route.abort()
  })
  await page.goto(state.path)
  if (process.env.KRATOS_I18N_AUDIT_OUT) {
    // Audit mode also runs against older builds, whose wording differs.
    await expect(page.locator("[data-slot='card']").first()).toBeVisible()
    await expect(page.getByText(/正在加载/)).toHaveCount(0)
    await page.waitForTimeout(800)
    return
  }
  await expect(page.getByText(state.expectText).first()).toBeVisible()
}

// Visible text and text-bearing attributes of the auth cards and toasts. A
// closed <details> (the error page's technical details) is not rendered, so
// innerText leaves it out, as the user sees it.
async function collectVisibleText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-slot='card'], [data-sonner-toast]"))
    const lines: string[] = []
    for (const root of roots) {
      for (const line of root.innerText.split("\n")) {
        if (line.trim()) lines.push(line.trim())
      }
      for (const element of Array.from(root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [alt], [title]"))) {
        if (element.closest("details:not([open])") && element.tagName !== "SUMMARY") continue
        for (const attribute of ["placeholder", "aria-label", "alt", "title"]) {
          const value = element.getAttribute(attribute)
          if (value?.trim()) lines.push(value.trim())
        }
      }
    }
    return lines
  })
}

// Brands, product names and user data that are legitimately Latin text.
const ALLOWED_LATIN = [
  /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, // email addresses (user data)
  /\bJBSWY3DPEHPK3PXP\w*/g, // the fixtures' TOTP secret (shown for manual entry)
  /\b(?=[a-z0-9]*\d)[a-z0-9]{8}\b/g, // backup recovery codes
  /\b(Haruki|Toolbox|Google|Apple|App|Cookie|YubiKey|USB|QR|ID|Kanade|Mizuki)\b/g,
  /\bY\./g, // the fixture user name "Kanade Y."
]

function findLatinText(lines: string[]): string[] {
  return lines.filter((line) => {
    const stripped = ALLOWED_LATIN.reduce((text, pattern) => text.replace(pattern, " "), line)
    return /[A-Za-z]{2,}/.test(stripped)
  })
}

// Audit mode: KRATOS_I18N_AUDIT_OUT=<dir> records every visible line per state
// (and the Latin ones) instead of failing, e.g. to compare two builds.
const auditOut = process.env.KRATOS_I18N_AUDIT_OUT

test.describe("Kratos flows render in zh-CN", () => {
  for (const state of KRATOS_STATES) {
    test(state.name, async ({ page }) => {
      await openState(page, state)
      // Let toasts and late labels settle.
      await page.waitForTimeout(150)
      const lines = await collectVisibleText(page)
      const latin = findLatinText(lines)
      if (auditOut) {
        mkdirSync(auditOut, { recursive: true })
        writeFileSync(join(auditOut, `${state.name.replace("#", "--")}.json`), JSON.stringify({ latin, lines }, null, 2))
        return
      }
      expect(latin, `English text left on ${state.name}`).toEqual([])
    })
  }
})

test("the error page keeps the raw Kratos reason in collapsed technical details", async ({ page }) => {
  await openState(page, errorState("error-csrf", /安全校验未通过/))
  const reason = page.getByText(/Cross-Site-Request-Forgery/)
  await expect(reason).toBeHidden()
  await page.getByText("技术详情").click()
  await expect(reason).toBeVisible()
})

test("the recovery resend button posts the address it was issued for", async ({ page }) => {
  await openState(page, flowState("recovery", "recovery-sent-email", /重新发送验证码/))
  const resend = page.getByRole("button", { name: "重新发送验证码" })
  await expect(resend).toHaveAttribute("name", "email")
  await expect(resend).toHaveAttribute("value", "kanade@example.com")
})

test("Kratos webauthn.js alerts show as localized toasts while its script is on the page", async ({ page }) => {
  await openState(page, flowState("settings", "settings-initial", /添加通行密钥/, "section=mfa"))
  await page.evaluate(() => window.alert("This browser does not support WebAuthn!"))
  await expect(page.getByText("当前浏览器不支持通行密钥或安全密钥", { exact: false })).toBeVisible()
})

// Screenshots for review: KRATOS_I18N_SCREENSHOT_DIR=<dir> bunx playwright test tests/e2e/kratos-i18n.e2e.ts -g screenshot
const screenshotDir = process.env.KRATOS_I18N_SCREENSHOT_DIR
const SCREENSHOT_STATES = [
  "login-initial", "login-wrong-password", "registration-choose-credentials", "registration-password-too-short",
  "recovery-sent-email", "recovery-too-many-attempts", "settings-initial#section-mfa", "settings-keys-registered#section-mfa",
  "settings-initial#section-oidc", "error-csrf",
]

test.describe("screenshot", () => {
  test.skip(!screenshotDir, "set KRATOS_I18N_SCREENSHOT_DIR to capture screenshots")
  for (const name of SCREENSHOT_STATES) {
    for (const width of [390, 1440]) {
      for (const scheme of ["light", "dark"] as const) {
        test(`${name} ${width} ${scheme}`, async ({ page }) => {
          const state = KRATOS_STATES.find((candidate) => candidate.name === name)
          if (!state) throw new Error(`unknown state ${name}`)
          await page.setViewportSize({ width, height: 900 })
          await page.emulateMedia({ colorScheme: scheme })
          await openState(page, state)
          await page.waitForTimeout(400)
          await page.screenshot({ path: join(screenshotDir ?? "", `${name.replace("#", "-")}-${width}-${scheme}.png`), fullPage: true })
        })
      }
    }
  }
})
