import { describe, expect, it } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"

// The API module pulls in the user store, which persists to web storage at import.
function installStorageStub(name: "localStorage" | "sessionStorage") {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

async function importInheritApi() {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  return await import("./inherit")
}

function refusal(status: number, updatedData: unknown, headers: Record<string, string> = {}): AxiosError {
  const config = { url: "/api/inherit/jobs", method: "post", headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response: AxiosResponse = {
    data: { status, message: "你已有一个进行中的引继任务", updatedData },
    status,
    statusText: "",
    headers,
    config,
  }
  return new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, undefined, response)
}

describe("toInheritApiError", () => {
  it("carries the running job id of a job_already_running refusal", async () => {
    const { InheritApiError, toInheritApiError } = await importInheritApi()
    const error = toInheritApiError(refusal(409, { code: "job_already_running", job_id: "job-7" }))
    expect(error).toBeInstanceOf(InheritApiError)
    expect(error.code).toBe("job_already_running")
    expect(error.status).toBe(409)
    expect(error.runningJobId).toBe("job-7")
  })

  it("has no running job id when an older backend leaves it out", async () => {
    const { toInheritApiError } = await importInheritApi()
    const error = toInheritApiError(refusal(409, { code: "job_already_running" }))
    expect(error.code).toBe("job_already_running")
    expect(error.runningJobId).toBe("")
  })

  it("never takes a job id from another refusal", async () => {
    const { toInheritApiError } = await importInheritApi()
    const error = toInheritApiError(refusal(429, { code: "rate_limited", job_id: "job-7" }, { "retry-after": "30" }))
    expect(error.code).toBe("rate_limited")
    expect(error.retryAfter).toBe(30)
    expect(error.runningJobId).toBe("")
  })
})
