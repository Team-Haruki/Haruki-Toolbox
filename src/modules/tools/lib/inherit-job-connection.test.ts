import { describe, expect, it } from "bun:test"
import {
  INHERIT_POLL_INTERVAL_MS,
  INHERIT_SOCKET_SILENCE_MS,
  InheritCommandLostError,
  InheritJobConnection,
  InheritSocketUnavailableError,
  resolveInheritJobSocketUrl,
  type InheritConnectionState,
  type InheritJobConnectionDeps,
  type InheritSocketLike,
} from "@/modules/tools/lib/inherit-job-connection"
import { INHERIT_JOB_STEPS, normalizeInheritJob, type InheritJob } from "@/modules/tools/lib/inherit-job"

function wireJob(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    server: "jp",
    upload_type: "suite",
    new_password_mode: "random",
    status,
    current_step: "bootstrap",
    steps: INHERIT_JOB_STEPS.map((name) => ({ name, status: "pending" })),
    ...extra,
  }
}

function parsed(status: string, extra: Record<string, unknown> = {}): InheritJob {
  const job = normalizeInheritJob(wireJob(status, extra))
  if (!job) throw new Error("bad fixture")
  return job
}

class FakeSocket implements InheritSocketLike {
  readyState = 0
  sent: string[] = []
  closed = false
  readonly url: string
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { code?: number }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.readyState = 3
    this.onclose?.({ code: 1000 })
  }

  open() {
    this.readyState = 1
    this.onopen?.({})
  }

  receive(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) })
  }

  drop() {
    this.closed = true
    this.readyState = 3
    this.onclose?.({ code: 1006 })
  }
}

class ManualTimers {
  private next = 1
  readonly pending = new Map<number, { at: number; fn: () => void }>()
  now = 0

  set = (fn: () => void, ms: number): unknown => {
    const id = this.next++
    this.pending.set(id, { at: this.now + ms, fn })
    return id
  }

  clear = (handle: unknown) => {
    this.pending.delete(handle as number)
  }

  /** Runs every timer due within `ms`, in order. */
  async advance(ms: number) {
    const target = this.now + ms
    for (;;) {
      const due = [...this.pending.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      this.pending.delete(due[0])
      this.now = due[1].at
      due[1].fn()
      await flush()
    }
    this.now = target
  }
}

async function flush() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve()
}

function setup(options: { ticket?: (jobId: string) => Promise<string>; snapshot?: () => Promise<InheritJob>; noSocket?: boolean } = {}) {
  const timers = new ManualTimers()
  const sockets: FakeSocket[] = []
  const jobs: InheritJob[] = []
  const states: InheritConnectionState[] = []
  let gone = 0
  let snapshotCalls = 0
  const deps: InheritJobConnectionDeps = {
    fetchTicket: options.ticket ?? (async () => "ticket"),
    fetchSnapshot: async () => {
      snapshotCalls += 1
      return options.snapshot ? options.snapshot() : parsed("running")
    },
    socketUrl: (jobId, ticket) => `ws://api.test/api/inherit/jobs/${jobId}/ws?ticket=${ticket}`,
    createSocket: (url) => {
      if (options.noSocket) return null
      const socket = new FakeSocket(url)
      sockets.push(socket)
      return socket
    },
    errorCode: (error) => (error as { code?: string }).code ?? "",
    commandError: ({ code, message }) => Object.assign(new Error(message), { code }),
    setTimer: timers.set,
    clearTimer: timers.clear,
  }
  const connection = new InheritJobConnection("job-1", deps, {
    onJob: (job) => jobs.push(job),
    onState: (state) => states.push(state),
    onGone: () => {
      gone += 1
    },
  })
  return { connection, timers, sockets, jobs, states, get gone() { return gone }, get snapshotCalls() { return snapshotCalls } }
}

describe("resolveInheritJobSocketUrl", () => {
  it("turns the API base into a ticketed ws(s) URL", () => {
    expect(resolveInheritJobSocketUrl("https://api.example.test/", "job 1", "t+k")).toBe(
      "wss://api.example.test/api/inherit/jobs/job%201/ws?ticket=t%2Bk",
    )
    expect(resolveInheritJobSocketUrl("http://127.0.0.1:9", "j", "t")).toBe("ws://127.0.0.1:9/api/inherit/jobs/j/ws?ticket=t")
    expect(resolveInheritJobSocketUrl("/backend", "j", "t", "https://toolbox.example.test")).toBe(
      "wss://toolbox.example.test/backend/api/inherit/jobs/j/ws?ticket=t",
    )
  })
})

describe("InheritJobConnection", () => {
  it("goes live on open, applies snapshots and events, and answers pings", async () => {
    const ctx = setup()
    ctx.connection.start()
    await flush()
    expect(ctx.sockets).toHaveLength(1)
    expect(ctx.sockets[0].url).toContain("ticket=ticket")
    ctx.sockets[0].open()
    expect(ctx.connection.isLive).toBe(true)
    expect(ctx.states.at(-1)).toBe("live")

    ctx.sockets[0].receive({ type: "snapshot", job: wireJob("running") })
    ctx.sockets[0].receive({ type: "event", event: { step: "preview", status: "running", at: "x" }, job: wireJob("running", { current_step: "preview" }) })
    expect(ctx.jobs.map((job) => job.currentStep)).toEqual(["bootstrap", "preview"])

    ctx.sockets[0].receive({ type: "ping", at: "x" })
    expect(ctx.sockets[0].sent).toContain(JSON.stringify({ type: "pong" }))
  })

  it("resolves a command with its ack and rejects it with the error frame", async () => {
    const ctx = setup()
    ctx.connection.start()
    await flush()
    ctx.sockets[0].open()

    const confirmed = ctx.connection.send({ type: "confirm", password: "pw", previousPassword: "old" })
    expect(JSON.parse(ctx.sockets[0].sent.at(-1) ?? "{}")).toEqual({ type: "confirm", password: "pw", previous_password: "old" })
    ctx.sockets[0].receive({ type: "ack", action: "confirm", job: wireJob("running") })
    expect((await confirmed).status).toBe("running")

    const cancelled = ctx.connection.send({ type: "cancel" })
    ctx.sockets[0].receive({ type: "error", action: "cancel", code: "cannot_cancel", message: "too late" })
    await expect(cancelled).rejects.toMatchObject({ code: "cannot_cancel" })
  })

  it("refuses commands while not connected so the caller can use HTTP", async () => {
    const ctx = setup()
    await expect(ctx.connection.send({ type: "cancel" })).rejects.toBeInstanceOf(InheritSocketUnavailableError)
  })

  it("fails an in-flight command when the socket drops, then reconnects and polls meanwhile", async () => {
    const ctx = setup()
    ctx.connection.start()
    await flush()
    ctx.sockets[0].open()
    const pending = ctx.connection.send({ type: "confirm", password: "pw" })
    ctx.sockets[0].drop()
    await expect(pending).rejects.toBeInstanceOf(InheritCommandLostError)
    expect(ctx.states.at(-1)).toBe("reconnecting")

    // Polling starts at once while the socket is down.
    await ctx.timers.advance(0)
    expect(ctx.snapshotCalls).toBe(1)

    await ctx.timers.advance(1_000)
    expect(ctx.sockets).toHaveLength(2)
    ctx.sockets[1].open()
    expect(ctx.states.at(-1)).toBe("live")
    const calls = ctx.snapshotCalls
    await ctx.timers.advance(INHERIT_POLL_INTERVAL_MS * 3)
    expect(ctx.snapshotCalls).toBe(calls)
  })

  it("reconnects a socket that went silent", async () => {
    const ctx = setup()
    ctx.connection.start()
    await flush()
    ctx.sockets[0].open()
    await ctx.timers.advance(INHERIT_SOCKET_SILENCE_MS)
    expect(ctx.sockets[0].closed).toBe(true)
    await ctx.timers.advance(1_000)
    expect(ctx.sockets).toHaveLength(2)
  })

  it("stops after the final snapshot and does not reconnect on the closing frame", async () => {
    const ctx = setup()
    ctx.connection.start()
    await flush()
    ctx.sockets[0].open()
    ctx.sockets[0].receive({ type: "event", event: { step: "done", status: "done", at: "x" }, job: wireJob("succeeded") })
    ctx.sockets[0].close()
    await ctx.timers.advance(60_000)
    expect(ctx.sockets).toHaveLength(1)
    expect(ctx.states.at(-1)).toBe("closed")
  })

  it("falls back to polling when sockets keep failing, and reports a vanished job", async () => {
    let snapshotStatus = "running"
    const ctx = setup({
      snapshot: async () => {
        if (snapshotStatus === "gone") throw Object.assign(new Error("not found"), { code: "job_not_found" })
        return parsed(snapshotStatus)
      },
    })
    ctx.connection.start()
    await flush()
    for (let attempt = 0; attempt < 3; attempt += 1) {
      ctx.sockets.at(-1)?.drop()
      await ctx.timers.advance(8_000)
    }
    expect(ctx.states).toContain("polling")
    expect(ctx.jobs.length).toBeGreaterThan(0)

    snapshotStatus = "gone"
    await ctx.timers.advance(INHERIT_POLL_INTERVAL_MS + 20_000)
    expect(ctx.gone).toBe(1)
    expect(ctx.states.at(-1)).toBe("closed")
  })

  it("polls only when WebSockets are unavailable", async () => {
    const ctx = setup({ noSocket: true })
    ctx.connection.start()
    await flush()
    expect(ctx.states.at(-1)).toBe("polling")
    await ctx.timers.advance(0)
    await ctx.timers.advance(INHERIT_POLL_INTERVAL_MS)
    expect(ctx.snapshotCalls).toBe(2)
  })

  it("ends at once when the ticket says the job is gone", async () => {
    const ctx = setup({ ticket: async () => { throw Object.assign(new Error("nope"), { code: "job_not_found" }) } })
    ctx.connection.start()
    await flush()
    expect(ctx.gone).toBe(1)
    expect(ctx.sockets).toHaveLength(0)
  })
})
