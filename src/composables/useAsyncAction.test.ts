import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { AdminReauthCancelledError } from "@/lib/admin-reauth"

type ToastCall = { kind: "error" | "success" | "warning"; title: string }
const toastCalls: ToastCall[] = []

mock.module("vue-sonner", () => ({
  toast: {
    error: (title: string) => toastCalls.push({ kind: "error", title }),
    success: (title: string) => toastCalls.push({ kind: "success", title }),
    warning: (title: string) => toastCalls.push({ kind: "warning", title }),
  },
}))

const { runAsyncAction } = await import("./useAsyncAction")

describe("runAsyncAction", () => {
  beforeEach(() => {
    toastCalls.length = 0
  })
  afterEach(() => {
    toastCalls.length = 0
  })

  test("toasts a failure by default and resolves null", async () => {
    const loading = { value: false }
    const result = await runAsyncAction(loading, async () => { throw new Error("boom") }, { errorTitle: "Failed" })
    expect(result).toBeNull()
    expect(loading.value).toBe(false)
    expect(toastCalls).toEqual([{ kind: "error", title: "Failed" }])
  })

  test("throwOnError rethrows without toasting, after onError", async () => {
    const loading = { value: false }
    const failure = new Error("boom")
    const seen: unknown[] = []
    const outcome = runAsyncAction(loading, async () => { throw failure }, {
      errorTitle: "Failed",
      throwOnError: true,
      onError: (error) => { seen.push(error) },
    })
    await expect(outcome).rejects.toBe(failure)
    expect(seen).toEqual([failure])
    expect(loading.value).toBe(false)
    expect(toastCalls).toEqual([])
  })

  test("a cancelled admin reauth is silent: no toast, no onError", async () => {
    const loading = { value: false }
    let onErrorCalls = 0
    const result = await runAsyncAction(loading, async () => { throw new AdminReauthCancelledError(new Error("403")) }, {
      errorTitle: "Failed",
      onError: () => { onErrorCalls += 1 },
    })
    expect(result).toBeNull()
    expect(onErrorCalls).toBe(0)
    expect(toastCalls).toEqual([])
  })

  test("a cancelled admin reauth still propagates under throwOnError so a dialog can end its pending state", async () => {
    const loading = { value: false }
    const cancelled = new AdminReauthCancelledError(new Error("403"))
    const outcome = runAsyncAction(loading, async () => { throw cancelled }, {
      errorTitle: "Failed",
      throwOnError: true,
    })
    await expect(outcome).rejects.toBe(cancelled)
    expect(toastCalls).toEqual([])
  })

  test("success toasts after onSuccess when asked and returns the result", async () => {
    const loading = { value: false }
    const order: string[] = []
    const result = await runAsyncAction(loading, async () => "ok", {
      errorTitle: "Failed",
      successMessage: "Done",
      successAfterOnSuccess: true,
      onSuccess: () => { order.push("onSuccess") },
    })
    expect(result).toBe("ok")
    expect(order).toEqual(["onSuccess"])
    expect(toastCalls).toEqual([{ kind: "success", title: "Done" }])
  })
})
