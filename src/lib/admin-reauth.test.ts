import { describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import {
  ADMIN_REAUTH_ENDPOINT,
  classifyAdminReauthFailure,
  createAdminReauthGate,
  isAdminReauthRequiredError,
  withAdminReauthRetry,
} from "./admin-reauth"

function apiError(url: string, status: number, message: string): AxiosError {
  const config = { url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response = {
    data: { status, message },
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse
  return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, undefined, response)
}

const reauthRequired = () => apiError("/api/admin/config/runtime", 403, "reauthentication required")

describe("isAdminReauthRequiredError", () => {
  test("matches the 403 an admin route returns without a recent reauth", () => {
    expect(isAdminReauthRequiredError(reauthRequired())).toBe(true)
    expect(isAdminReauthRequiredError(apiError("/api/admin/config/public-api-keys", 403, "reauthentication required"))).toBe(true)
    expect(isAdminReauthRequiredError(apiError("/api/admin/config/game-data-cache/purge", 403, " Reauthentication Required "))).toBe(true)
    expect(isAdminReauthRequiredError(apiError("https://api.example/api/admin/config/runtime", 403, "reauthentication required"))).toBe(true)
  })

  test("ignores other statuses, messages, routes and errors", () => {
    expect(isAdminReauthRequiredError(apiError("/api/admin/config/runtime", 401, "reauthentication required"))).toBe(false)
    expect(isAdminReauthRequiredError(apiError("/api/admin/config/runtime", 403, "super admin required"))).toBe(false)
    expect(isAdminReauthRequiredError(apiError("/api/user/1/settings", 403, "reauthentication required"))).toBe(false)
    // The reauth endpoint itself never triggers another prompt.
    expect(isAdminReauthRequiredError(apiError(ADMIN_REAUTH_ENDPOINT, 403, "reauthentication required"))).toBe(false)
    expect(isAdminReauthRequiredError(new Error("reauthentication required"))).toBe(false)
    expect(isAdminReauthRequiredError(null)).toBe(false)
  })
})

describe("withAdminReauthRetry", () => {
  test("returns the first result without prompting", async () => {
    let prompts = 0
    const result = await withAdminReauthRetry(async () => "ok", async () => {
      prompts += 1
      return true
    })
    expect(result).toBe("ok")
    expect(prompts).toBe(0)
  })

  test("re-sends once after a successful reauth", async () => {
    let sends = 0
    let prompts = 0
    const result = await withAdminReauthRetry(async () => {
      sends += 1
      if (sends === 1) throw reauthRequired()
      return "saved"
    }, async () => {
      prompts += 1
      return true
    })
    expect(result).toBe("saved")
    expect(sends).toBe(2)
    expect(prompts).toBe(1)
  })

  test("a second reauth-required failure goes back to the caller instead of looping", async () => {
    let sends = 0
    let prompts = 0
    const second = reauthRequired()
    const outcome = withAdminReauthRetry(async () => {
      sends += 1
      throw sends === 1 ? reauthRequired() : second
    }, async () => {
      prompts += 1
      return true
    })
    await expect(outcome).rejects.toBe(second)
    expect(sends).toBe(2)
    expect(prompts).toBe(1)
  })

  test("a cancelled or failing prompt rethrows the original error without re-sending", async () => {
    for (const prompt of [async () => false, async () => { throw new Error("dialog failed") }]) {
      let sends = 0
      const original = reauthRequired()
      const outcome = withAdminReauthRetry(async () => {
        sends += 1
        throw original
      }, prompt)
      await expect(outcome).rejects.toBe(original)
      expect(sends).toBe(1)
    }
  })

  test("other errors pass through without prompting", async () => {
    let prompts = 0
    const forbidden = apiError("/api/admin/config/runtime", 403, "super admin required")
    const outcome = withAdminReauthRetry(async () => {
      throw forbidden
    }, async () => {
      prompts += 1
      return true
    })
    await expect(outcome).rejects.toBe(forbidden)
    expect(prompts).toBe(0)
  })
})

describe("createAdminReauthGate", () => {
  test("resolves false while nothing is registered", async () => {
    const gate = createAdminReauthGate()
    expect(await gate.request()).toBe(false)
  })

  test("shares one open prompt between concurrent requests", async () => {
    const gate = createAdminReauthGate()
    let opened = 0
    let answer: (value: boolean) => void = () => undefined
    gate.register(() => {
      opened += 1
      return new Promise<boolean>((resolve) => {
        answer = resolve
      })
    })
    const first = gate.request()
    const second = gate.request()
    answer(true)
    expect(await Promise.all([first, second])).toEqual([true, true])
    expect(opened).toBe(1)

    // Settled prompts are not reused.
    const third = gate.request()
    answer(false)
    expect(await third).toBe(false)
    expect(opened).toBe(2)
  })

  test("unregistering only removes the same prompt", async () => {
    const gate = createAdminReauthGate()
    const unregisterOld = gate.register(async () => true)
    gate.register(async () => true)
    unregisterOld()
    expect(await gate.request()).toBe(true)
  })
})

describe("classifyAdminReauthFailure", () => {
  test("maps the reauth endpoint's answers", () => {
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 403, "password mismatch"))).toBe("passwordMismatch")
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 403, "reauthentication required"))).toBe("rejected")
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 400, "password is required"))).toBe("passwordRequired")
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 400, "invalid request payload"))).toBe("invalidInput")
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 401, "invalid user session"))).toBe("fatal")
    expect(classifyAdminReauthFailure(apiError(ADMIN_REAUTH_ENDPOINT, 500, "failed to verify account"))).toBe("fatal")
    expect(classifyAdminReauthFailure(new Error("network"))).toBe("fatal")
  })
})
