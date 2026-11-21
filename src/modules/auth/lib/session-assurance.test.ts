import { beforeEach, describe, expect, it } from "bun:test"
import type { KratosSessionState } from "./kratos"

const storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

const {
  SECOND_FACTOR_RETURN_PARAM,
  buildSecondFactorEnrollLocation,
  buildSecondFactorLoginLocation,
  currentKratosSessionGeneration,
  decideSecondFactor,
  forgetKratosSessionState,
  isSecondFactorAalQuery,
  loadKratosSessionState,
  loadSecondFactorGate,
  rememberKratosSessionState,
  resolveLoginFlowAal,
  resolveSecondFactorGate,
  resolveSecondFactorRedirect,
  withoutSecondFactorReturnMarker,
} = await import("./session-assurance")

const active = (aal: string): KratosSessionState => ({ status: "active", aal, session: {} })
const PENDING: KratosSessionState = { status: "second-factor-required" }
const NONE: KratosSessionState = { status: "none" }
const ORIGIN = "https://toolbox.example"

describe("resolveSecondFactorGate", () => {
  it("passes a session that reached aal2", () => {
    expect(resolveSecondFactorGate(active("aal2"))).toBe("pass")
  })

  it("asks for the verification when a second factor exists and was not passed", () => {
    expect(resolveSecondFactorGate(PENDING)).toBe("verify")
  })

  it("asks for a setup when Kratos accepts the session at the first level", () => {
    expect(resolveSecondFactorGate(active("aal1"))).toBe("enroll")
    expect(resolveSecondFactorGate(active(""))).toBe("enroll")
  })

  it("does not decide without an answer from Kratos", () => {
    expect(resolveSecondFactorGate(null)).toBe("unknown")
    expect(resolveSecondFactorGate(NONE)).toBe("unknown")
  })
})

describe("second factor locations", () => {
  it("sends the verification to the sign-in page with the page that asked", () => {
    expect(buildSecondFactorLoginLocation("/admin/users?page=2")).toEqual({
      name: "user.login",
      query: { aal: "aal2", redirect: "/admin/users?page=2", reason: "second-factor-required" },
    })
  })

  it("sends the setup to the two-step settings page with the page that asked", () => {
    expect(buildSecondFactorEnrollLocation("/admin/dashboard")).toEqual({
      name: "user.identityMfaSettings",
      query: { aal2_redirect: "/admin/dashboard" },
    })
  })

  it("drops a target that is not a path on this site", () => {
    for (const target of ["https://evil.example/", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 42]) {
      expect(buildSecondFactorLoginLocation(target).query).toEqual({ aal: "aal2", reason: "second-factor-required" })
      expect(buildSecondFactorEnrollLocation(target).query).toEqual({})
    }
  })
})

describe("decideSecondFactor", () => {
  const target = "/admin/dashboard"

  it("lets an aal2 session through", () => {
    expect(decideSecondFactor({ gate: "pass", returned: false, target })).toEqual({ kind: "continue" })
  })

  it("only drops the marker when an aal2 session arrives with it", () => {
    expect(decideSecondFactor({ gate: "pass", returned: true, target })).toEqual({ kind: "strip-marker" })
  })

  it("does not hold the page back when Kratos gave no answer", () => {
    expect(decideSecondFactor({ gate: "unknown", returned: false, target })).toEqual({ kind: "continue" })
    expect(decideSecondFactor({ gate: "unknown", returned: true, target })).toEqual({ kind: "strip-marker" })
  })

  it("redirects to the verification or the setup", () => {
    expect(decideSecondFactor({ gate: "verify", returned: false, target })).toEqual({
      kind: "redirect",
      location: buildSecondFactorLoginLocation(target),
    })
    expect(decideSecondFactor({ gate: "enroll", returned: false, target })).toEqual({
      kind: "redirect",
      location: buildSecondFactorEnrollLocation(target),
    })
  })

  it("stops instead of going round again after a round trip that changed nothing", () => {
    expect(decideSecondFactor({ gate: "verify", returned: true, target })).toEqual({ kind: "failed" })
    expect(decideSecondFactor({ gate: "enroll", returned: true, target })).toEqual({ kind: "failed" })
  })
})

describe("withoutSecondFactorReturnMarker", () => {
  it("removes only the marker", () => {
    const query: Record<string, string> = { page: "2", [SECOND_FACTOR_RETURN_PARAM]: "1" }
    expect(withoutSecondFactorReturnMarker(query)).toEqual({ page: "2" })
    // The address the guard was given is left as it was.
    expect(query[SECOND_FACTOR_RETURN_PARAM]).toBe("1")
  })

  it("returns the same query when there is no marker", () => {
    const query = { page: "2" }
    expect(withoutSecondFactorReturnMarker(query)).toBe(query)
  })
})

describe("resolveLoginFlowAal", () => {
  it("asks for the second factor when the page was opened for it", () => {
    expect(resolveLoginFlowAal("aal2", null)).toBe("aal2")
    expect(resolveLoginFlowAal(" AAL2 ", NONE)).toBe("aal2")
    expect(isSecondFactorAalQuery("aal2")).toBe(true)
  })

  it("asks for the second factor on a session that only passed the first", () => {
    expect(resolveLoginFlowAal(undefined, PENDING)).toBe("aal2")
  })

  it("starts a plain sign-in otherwise", () => {
    expect(resolveLoginFlowAal(undefined, null)).toBeUndefined()
    expect(resolveLoginFlowAal(undefined, NONE)).toBeUndefined()
    expect(resolveLoginFlowAal("aal1", active("aal1"))).toBeUndefined()
    expect(resolveLoginFlowAal(["aal2"], active("aal2"))).toBeUndefined()
    expect(isSecondFactorAalQuery("aal3")).toBe(false)
  })
})

describe("resolveSecondFactorRedirect", () => {
  it("takes the page's own query first", () => {
    expect(resolveSecondFactorRedirect("/admin/dashboard", `${ORIGIN}/user/settings?aal2_redirect=%2Fother`, ORIGIN)).toBe("/admin/dashboard")
  })

  it("recovers it from the flow's return target", () => {
    const returnTo = `${ORIGIN}/user/settings?section=mfa&_identity_saved=1&aal2_redirect=${encodeURIComponent("/admin/users?page=2")}`
    expect(resolveSecondFactorRedirect(undefined, returnTo, ORIGIN)).toBe("/admin/users?page=2")
  })

  it("accepts neither another site nor a target leading to one", () => {
    expect(resolveSecondFactorRedirect("https://evil.example/")).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, "https://evil.example/user/settings?aal2_redirect=%2Fadmin", ORIGIN)).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, `${ORIGIN}/user/settings?aal2_redirect=${encodeURIComponent("//evil.example")}`, ORIGIN)).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, `${ORIGIN}/user/settings?section=mfa`, ORIGIN)).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, "", ORIGIN)).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, `${ORIGIN}/user/settings?aal2_redirect=%2Fadmin`)).toBeNull()
    expect(resolveSecondFactorRedirect(undefined, "http://[bad", ORIGIN)).toBeNull()
  })
})

describe("loadKratosSessionState", () => {
  beforeEach(() => {
    forgetKratosSessionState()
  })

  it("asks once per document", async () => {
    let calls = 0
    const fetchState = async () => {
      calls += 1
      return active("aal2")
    }
    expect(await loadKratosSessionState(fetchState)).toEqual(active("aal2"))
    expect(await loadKratosSessionState(fetchState)).toEqual(active("aal2"))
    expect(calls).toBe(1)
  })

  it("asks again after a failure, and after being told to forget", async () => {
    let calls = 0
    const failing = async (): Promise<KratosSessionState> => {
      calls += 1
      throw new Error("unreachable")
    }
    expect(await loadKratosSessionState(failing)).toBeNull()
    expect(await loadKratosSessionState(failing)).toBeNull()
    expect(calls).toBe(2)

    expect(await loadKratosSessionState(async () => active("aal1"))).toEqual(active("aal1"))
    forgetKratosSessionState()
    expect(await loadKratosSessionState(async () => PENDING)).toEqual(PENDING)
  })

  it("uses what the session bootstrap already learned", async () => {
    rememberKratosSessionState(PENDING)
    expect(await loadKratosSessionState(async () => {
      throw new Error("not asked")
    })).toEqual(PENDING)
  })

  it("does not keep what a bootstrap learned before a sign-out", async () => {
    const startedAt = currentKratosSessionGeneration()
    // Signed out in place while the bootstrap was still waiting for the backend.
    forgetKratosSessionState()
    rememberKratosSessionState(active("aal2"), startedAt)
    expect(await loadKratosSessionState(async () => NONE)).toEqual(NONE)

    forgetKratosSessionState()
    rememberKratosSessionState(active("aal2"), currentKratosSessionGeneration())
    expect(await loadKratosSessionState(async () => NONE)).toEqual(active("aal2"))
  })
})

describe("loadSecondFactorGate", () => {
  beforeEach(() => {
    forgetKratosSessionState()
  })

  const counting = (...answers: KratosSessionState[]) => {
    const calls = { count: 0 }
    const fetchState = async () => answers[Math.min(calls.count++, answers.length - 1)]!
    return { calls, fetchState }
  }

  it("uses a remembered aal2 answer without asking", async () => {
    rememberKratosSessionState(active("aal2"))
    const { calls, fetchState } = counting(NONE)
    expect(await loadSecondFactorGate(fetchState)).toBe("pass")
    expect(calls.count).toBe(0)
  })

  it("asks once on a fresh document", async () => {
    const { calls, fetchState } = counting(active("aal1"), active("aal2"))
    expect(await loadSecondFactorGate(fetchState)).toBe("enroll")
    expect(calls.count).toBe(1)
  })

  it("asks again before turning the person away on a remembered answer", async () => {
    // The second factor was set up in another tab after this one asked.
    const { calls, fetchState } = counting(active("aal1"), active("aal2"))
    expect(await loadSecondFactorGate(fetchState)).toBe("enroll")
    expect(await loadSecondFactorGate(fetchState)).toBe("pass")
    expect(calls.count).toBe(2)
    // The new answer is the remembered one from here on.
    expect(await loadSecondFactorGate(fetchState)).toBe("pass")
    expect(calls.count).toBe(2)
  })

  it("keeps turning them away while Kratos says the same", async () => {
    rememberKratosSessionState(PENDING)
    const { calls, fetchState } = counting(PENDING)
    expect(await loadSecondFactorGate(fetchState)).toBe("verify")
    expect(calls.count).toBe(1)
  })

  it("does not decide when Kratos gives no answer", async () => {
    expect(await loadSecondFactorGate(async () => {
      throw new Error("unreachable")
    })).toBe("unknown")
  })
})
