import { describe, expect, it } from "bun:test"
import {
  canCancelJob,
  enteredCodeValidity,
  formatStepDuration,
  hasJobStartedExecuting,
  INHERIT_JOB_STEPS,
  isNewCodeUnsaved,
  isReusableInheritPassword,
  isValidVaultPin,
  jobMomentBetween,
  normalizeInheritJob,
  readRunningJobId,
  remainingParts,
  splitUnreachedSteps,
  stepDurationMs,
  summarizeJobPhases,
  type InheritJob,
} from "@/modules/tools/lib/inherit-job"

function wireJob(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "job-1",
    server: "jp",
    upload_type: "suite",
    new_password_mode: "reuse",
    status: "running",
    current_step: "bootstrap",
    steps: INHERIT_JOB_STEPS.map((name) => ({ name, status: "pending" })),
    created_at: "2026-10-30T00:00:00Z",
    updated_at: "2026-10-30T00:00:00Z",
    ...overrides,
  }
}

function job(overrides: Record<string, unknown> = {}): InheritJob {
  const parsed = normalizeInheritJob(wireJob(overrides))
  if (!parsed) throw new Error("fixture did not parse")
  return parsed
}

function withSteps(statuses: Partial<Record<(typeof INHERIT_JOB_STEPS)[number], string>>) {
  return INHERIT_JOB_STEPS.map((name) => ({ name, status: statuses[name] ?? "pending" }))
}

describe("normalizeInheritJob", () => {
  it("parses the contract snapshot", () => {
    const parsed = normalizeInheritJob(wireJob({
      status: "awaiting_confirm",
      current_step: "awaiting_confirm",
      steps: [
        { name: "bootstrap", status: "done", started_at: "2026-10-30T00:00:00Z", finished_at: "2026-10-30T00:00:01.5Z",
          substeps: [{ name: "cookies", status: "done", at: "2026-10-30T00:00:00.5Z" }, { name: "version", status: "warning", note: "slow" }] },
        { name: "preview", status: "done" },
        { name: "awaiting_confirm", status: "running", started_at: "2026-10-30T00:00:02Z" },
      ],
      preview: {
        nickname: "Miku",
        rank: 150,
        game_user_id_masked: "16*************363",
        transfer_restriction: { is_restrict_device_transfer: true, restrict_end_at: 1793404800000, rest_transfer_count: 2 },
      },
      unlock: { kind: "pin", initialized: false },
      confirm_deadline: "2026-10-30T00:05:02Z",
      new_code: { inherit_id: "NEWCODE987654321", password: "secret-pass", expires_at: "2026-10-31T00:00:00Z" },
      warnings: [{ code: "vault_db_unavailable", message: "…" }, { message: "no code" }],
      vault_entry_id: "entry-1",
    }))
    expect(parsed).not.toBeNull()
    expect(parsed?.status).toBe("awaiting_confirm")
    expect(parsed?.steps.map((step) => step.name)).toEqual([...INHERIT_JOB_STEPS])
    expect(parsed?.steps[0].substeps).toEqual([
      { name: "cookies", status: "done", note: "", at: "2026-10-30T00:00:00.5Z" },
      { name: "version", status: "warning", note: "slow", at: null },
    ])
    expect(parsed?.steps.find((step) => step.name === "execute")?.status).toBe("pending")
    expect(parsed?.preview?.transferRestriction?.restTransferCount).toBe(2)
    expect(parsed?.unlock).toEqual({ kind: "pin", initialized: false })
    expect(parsed?.newCode).toEqual({ inheritId: "NEWCODE987654321", password: "secret-pass", expiresAt: "2026-10-31T00:00:00Z" })
    expect(parsed?.warnings).toEqual([{ code: "vault_db_unavailable", message: "…" }])
    expect(parsed?.vaultEntryId).toBe("entry-1")
  })

  it("rejects payloads that are not a job", () => {
    expect(normalizeInheritJob(null)).toBeNull()
    expect(normalizeInheritJob({ status: "running" })).toBeNull()
    expect(normalizeInheritJob({ id: "x" })).toBeNull()
  })

  it("keeps steps a newer backend adds", () => {
    const parsed = job({ steps: [...withSteps({}), { name: "future_step", status: "done" }] })
    expect(parsed.steps.at(-1)?.name).toBe("future_step")
  })
})

describe("job state questions", () => {
  it("allows cancel only before the executing call", () => {
    expect(canCancelJob(job({ status: "running", steps: withSteps({ bootstrap: "running" }) }))).toBe(true)
    expect(canCancelJob(job({ status: "awaiting_confirm", steps: withSteps({ bootstrap: "done", preview: "done", awaiting_confirm: "running" }) }))).toBe(true)
    const executing = job({ status: "running", steps: withSteps({ awaiting_confirm: "done", execute: "running" }) })
    expect(hasJobStartedExecuting(executing)).toBe(true)
    expect(canCancelJob(executing)).toBe(false)
    expect(canCancelJob(job({ status: "cancelled", error: { code: "cancelled", message: "" } }))).toBe(false)
  })

  it("tells whether the entered code is still valid", () => {
    expect(enteredCodeValidity(job({ status: "cancelled", error: { code: "cancelled" } }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "confirm_timeout" } }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "transfer_restricted" } }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "execute_uncertain" } }))).toBe("unknown")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "fetch_failed" } }))).toBe("used")
    // Game errors depend on how far the job got.
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "game_error" }, steps: withSteps({ preview: "failed" }) }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "game_error" }, steps: withSteps({ execute: "done", fetch_suite: "failed" }) }))).toBe("used")
    // game_version_outdated is a 426, the game's definite answer: the code is
    // used only once the executing call went through, even when execute failed.
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "game_version_outdated" }, steps: withSteps({ preview: "failed" }) }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "game_version_outdated" }, steps: withSteps({ preview: "done", execute: "failed" }) }))).toBe("valid")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "game_version_outdated" }, steps: withSteps({ execute: "done", fetch_suite: "failed" }) }))).toBe("used")
    expect(enteredCodeValidity(job({ status: "failed", error: { code: "inherit_invalid" } }))).toBeNull()
    expect(enteredCodeValidity(job({ status: "running" }))).toBeNull()
  })

  it("flags a new code the vault could not keep", () => {
    expect(isNewCodeUnsaved(job({ warnings: [{ code: "vault_store_failed", message: "" }] }))).toBe(true)
    expect(isNewCodeUnsaved(job({ warnings: [{ code: "vault_db_unavailable", message: "" }] }))).toBe(false)
  })
})

describe("password rules", () => {
  it("accepts only 8-16 ASCII letters or digits for reuse", () => {
    expect(isReusableInheritPassword("abcd1234")).toBe(true)
    expect(isReusableInheritPassword("AbCdEfGhIjKlMnOp")).toBe(true)
    expect(isReusableInheritPassword("12345678")).toBe(true)
    expect(isReusableInheritPassword("1234567890123456")).toBe(true)
    expect(isReusableInheritPassword("A!b@c#d$e%f^g&h*")).toBe(false)
    expect(isReusableInheritPassword("abcd_123")).toBe(false)
    expect(isReusableInheritPassword("short7")).toBe(false)
    expect(isReusableInheritPassword("12345678901234567")).toBe(false)
    expect(isReusableInheritPassword("with space")).toBe(false)
    expect(isReusableInheritPassword("全角パスワード1234")).toBe(false)
    expect(isReusableInheritPassword("ａｂｃｄ１２３４")).toBe(false)
  })

  it("checks the vault PIN length in characters", () => {
    expect(isValidVaultPin("1234567")).toBe(false)
    expect(isValidVaultPin("12345678")).toBe(true)
    expect(isValidVaultPin("密码密码密码密码")).toBe(true)
    expect(isValidVaultPin("x".repeat(129))).toBe(false)
  })
})

describe("durations", () => {
  it("measures finished and running steps", () => {
    expect(stepDurationMs({ startedAt: "2026-10-30T00:00:00Z", finishedAt: "2026-10-30T00:00:02.5Z", status: "done" }, 0)).toBe(2500)
    expect(stepDurationMs({ startedAt: "2026-10-30T00:00:00Z", finishedAt: null, status: "running" }, Date.parse("2026-10-30T00:00:04Z"))).toBe(4000)
    expect(stepDurationMs({ startedAt: null, finishedAt: null, status: "pending" }, 0)).toBeNull()
  })

  it("formats compactly", () => {
    expect(formatStepDuration(420)).toBe("0.4 s")
    expect(formatStepDuration(12_400)).toBe("12 s")
    expect(formatStepDuration(65_000)).toBe("1 min 5 s")
  })

  it("splits a remaining time", () => {
    expect(remainingParts(0, 1)).toBeNull()
    expect(remainingParts(90_061_000, 0)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })
})

describe("readRunningJobId", () => {
  it("names the caller's running job from a job_already_running refusal", () => {
    expect(readRunningJobId("job_already_running", { code: "job_already_running", job_id: "job-7" })).toBe("job-7")
    expect(readRunningJobId("job_already_running", { code: "job_already_running", job_id: "  job-7 " })).toBe("job-7")
  })

  it("is empty when an older backend sends no id, or the id is unusable", () => {
    expect(readRunningJobId("job_already_running", { code: "job_already_running" })).toBe("")
    expect(readRunningJobId("job_already_running", { job_id: "" })).toBe("")
    expect(readRunningJobId("job_already_running", { job_id: 42 })).toBe("")
    expect(readRunningJobId("job_already_running", { job_id: "x".repeat(129) })).toBe("")
    expect(readRunningJobId("job_already_running", null)).toBe("")
  })

  it("ignores a job id on any other refusal", () => {
    expect(readRunningJobId("rate_limited", { code: "rate_limited", job_id: "job-7" })).toBe("")
    expect(readRunningJobId("", { job_id: "job-7" })).toBe("")
  })
})

describe("job moments", () => {
  const NEW_CODE = { inherit_id: "NEWCODE987654321", password: "pw", expires_at: "2026-10-31T00:00:00Z" }

  it("notices the preview arriving and the new code, once each, within one job", () => {
    const running = job({ status: "running" })
    const awaiting = job({ status: "awaiting_confirm" })
    expect(jobMomentBetween(running, awaiting)).toBe("awaiting_confirm")
    expect(jobMomentBetween(awaiting, awaiting)).toBeNull()
    const withCode = job({ status: "running", new_code: NEW_CODE })
    expect(jobMomentBetween(awaiting, withCode)).toBe("new_code")
    expect(jobMomentBetween(withCode, job({ status: "succeeded", new_code: NEW_CODE }))).toBeNull()
  })

  it("stays quiet for a job the page only just picked up", () => {
    const awaiting = job({ status: "awaiting_confirm" })
    expect(jobMomentBetween(null, awaiting)).toBeNull()
    expect(jobMomentBetween(job({ id: "job-0" }), awaiting)).toBeNull()
  })
})

describe("summarizeJobPhases", () => {
  const statuses = (value: InheritJob) => Object.fromEntries(summarizeJobPhases(value).map((phase) => [phase.key, phase.status]))

  it("starts with every phase pending and follows the running step", () => {
    expect(statuses(job())).toEqual({ read: "pending", confirm: "pending", transfer: "pending", data: "pending" })
    const reading = job({ steps: withSteps({ bootstrap: "done", preview: "running" }) })
    expect(statuses(reading)).toEqual({ read: "running", confirm: "pending", transfer: "pending", data: "pending" })
    const waiting = job({ status: "awaiting_confirm", steps: withSteps({ bootstrap: "done", preview: "done", awaiting_confirm: "running" }) })
    expect(statuses(waiting)).toEqual({ read: "done", confirm: "running", transfer: "pending", data: "pending" })
  })

  it("keeps a phase running between two of its steps", () => {
    const between = job({ steps: withSteps({ bootstrap: "done", preview: "done", awaiting_confirm: "done", execute: "done" }) })
    expect(statuses(between).transfer).toBe("running")
  })

  it("counts skipped steps as finished and marks the failed phase", () => {
    const done = job({ status: "succeeded", steps: INHERIT_JOB_STEPS.map((name) => ({ name, status: name === "fetch_mysekai" ? "skipped" : "done" })) })
    expect(statuses(done)).toEqual({ read: "done", confirm: "done", transfer: "done", data: "done" })
    const failed = job({
      status: "failed",
      steps: withSteps({
        bootstrap: "done", preview: "done", awaiting_confirm: "done", execute: "done", vault_store_credential: "done",
        login: "done", issue_new_code: "done", vault_store_code: "done", fetch_suite: "failed",
      }),
    })
    expect(statuses(failed)).toEqual({ read: "done", confirm: "done", transfer: "done", data: "failed" })
  })

  it("marks the phase a cancelled job stopped in, and leaves later ones pending", () => {
    const cancelled = job({ status: "cancelled", steps: withSteps({ bootstrap: "done", preview: "done", awaiting_confirm: "running" }) })
    expect(statuses(cancelled)).toEqual({ read: "done", confirm: "stopped", transfer: "pending", data: "pending" })
  })
})

describe("splitUnreachedSteps", () => {
  it("folds the untouched tail of a stopped job", () => {
    const stopped = job({ status: "failed", steps: withSteps({ bootstrap: "done", preview: "failed" }) })
    const { shown, hidden } = splitUnreachedSteps(stopped)
    expect(shown.map((step) => step.name)).toEqual(["bootstrap", "preview"])
    expect(hidden).toHaveLength(INHERIT_JOB_STEPS.length - 2)
  })

  it("hides nothing while the job runs or when every step ran", () => {
    const running = job({ status: "running", steps: withSteps({ bootstrap: "done", preview: "running" }) })
    expect(splitUnreachedSteps(running).hidden).toEqual([])
    const done = job({ status: "succeeded", steps: INHERIT_JOB_STEPS.map((name) => ({ name, status: name === "fetch_mysekai" ? "skipped" : "done" })) })
    expect(splitUnreachedSteps(done).hidden).toEqual([])
    expect(splitUnreachedSteps(done).shown).toHaveLength(INHERIT_JOB_STEPS.length)
  })
})
