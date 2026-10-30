import { asRecord } from "@/lib/record-utils"
import { isTerminalJobStatus, normalizeInheritJob, type InheritJob } from "@/modules/tools/lib/inherit-job"
import { toUnlockBody, type InheritUnlockInput } from "@/modules/tools/lib/inherit-vault"

/**
 * Live connection to one inherit job: the ticketed WebSocket first, HTTP
 * polling while it is down, automatic reconnects until the job ends. The
 * socket's first frame is always a full snapshot, so a reconnect needs no
 * catch-up logic. Everything it talks to is injected, which keeps it testable
 * without a browser.
 */

/** The part of the browser WebSocket this client uses. */
export interface InheritSocketLike {
  readonly readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: { code?: number }) => void) | null
  onerror: ((event: unknown) => void) | null
}

export interface InheritCommandError {
  code: string
  message: string
}

export interface InheritJobConnectionDeps {
  fetchTicket(jobId: string): Promise<string>
  fetchSnapshot(jobId: string): Promise<InheritJob>
  socketUrl(jobId: string, ticket: string): string
  /** Null (or throwing) when WebSockets are unavailable: the client then only polls. */
  createSocket(url: string): InheritSocketLike | null
  /** Error code of a failed ticket or snapshot request (`job_not_found` ends the connection). */
  errorCode(error: unknown): string
  /** Builds the error a refused WebSocket command rejects with. */
  commandError(error: InheritCommandError): Error
  setTimer?: (callback: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

export type InheritConnectionState = "connecting" | "live" | "reconnecting" | "polling" | "closed"

export interface InheritJobEventInfo {
  step: string
  substep: string
  status: string
  note: string
  errorCode: string
  at: string | null
}

export interface InheritJobConnectionHandlers {
  onJob(job: InheritJob): void
  onState?(state: InheritConnectionState): void
  onEvent?(event: InheritJobEventInfo): void
  /** The job does not exist (any more) for this user: it expired after an hour, or belongs to someone else. */
  onGone?(): void
}

export type InheritJobCommand =
  | ({ type: "confirm" } & InheritUnlockInput)
  | { type: "cancel" }

/** The socket is not open; send the command over HTTP instead. */
export class InheritSocketUnavailableError extends Error {
  constructor(message = "inherit job socket is not connected") {
    super(message)
    this.name = "InheritSocketUnavailableError"
  }
}

/** The socket dropped (or went silent) while a command was in flight: its outcome is unknown. */
export class InheritCommandLostError extends Error {
  constructor(message = "inherit job socket closed before the command was answered") {
    super(message)
    this.name = "InheritCommandLostError"
  }
}

const SOCKET_OPEN = 1
export const INHERIT_POLL_INTERVAL_MS = 3_000
export const INHERIT_RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000] as const
/** The server pings every 15 s; this much silence means a dead socket. */
export const INHERIT_SOCKET_SILENCE_MS = 45_000
/** Unlocking runs Argon2id and a Kratos login; the server allows a command 30 s. */
export const INHERIT_COMMAND_TIMEOUT_MS = 40_000
/** After this many failed connects in a row the client says it is polling. */
const FAILURES_BEFORE_POLLING = 3

/** `wss://<api host>/api/inherit/jobs/{id}/ws?ticket=…` for the API endpoint in use. */
export function resolveInheritJobSocketUrl(apiBase: string, jobId: string, ticket: string, origin = "http://localhost"): string {
  const base = apiBase.trim().replace(/\/+$/, "")
  const path = `${base}/api/inherit/jobs/${encodeURIComponent(jobId)}/ws`
  const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(base) ? new URL(path) : new URL(path, origin)
  url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:"
  url.searchParams.set("ticket", ticket)
  url.hash = ""
  return url.toString()
}

function readEvent(value: unknown): InheritJobEventInfo | null {
  const record = asRecord(value)
  if (!record || typeof record.step !== "string") return null
  return {
    step: record.step,
    substep: typeof record.substep === "string" ? record.substep : "",
    status: typeof record.status === "string" ? record.status : "",
    note: typeof record.note === "string" ? record.note : "",
    errorCode: typeof record.error_code === "string" ? record.error_code : "",
    at: typeof record.at === "string" ? record.at : null,
  }
}

interface PendingCommand {
  action: "confirm" | "cancel"
  resolve(job: InheritJob): void
  reject(error: Error): void
  timer: unknown
}

export class InheritJobConnection {
  private readonly jobId: string
  private readonly deps: InheritJobConnectionDeps
  private readonly handlers: InheritJobConnectionHandlers
  private socket: InheritSocketLike | null = null
  private generation = 0
  private stopped = false
  private finished = false
  private failures = 0
  private state: InheritConnectionState = "connecting"
  private reconnectTimer: unknown = null
  private pollTimer: unknown = null
  private silenceTimer: unknown = null
  private pending: PendingCommand | null = null

  constructor(jobId: string, deps: InheritJobConnectionDeps, handlers: InheritJobConnectionHandlers) {
    this.jobId = jobId
    this.deps = deps
    this.handlers = handlers
  }

  get connectionState(): InheritConnectionState {
    return this.state
  }

  get isLive(): boolean {
    return this.state === "live" && this.socket?.readyState === SOCKET_OPEN
  }

  start(): void {
    if (this.stopped) return
    void this.connect()
  }

  /** Ends the connection for good (the page left, or the job was dismissed). */
  stop(): void {
    if (this.stopped) return
    this.stopped = true
    this.teardownSocket()
    this.clearTimer("reconnectTimer")
    this.clearTimer("pollTimer")
    this.failPending(new InheritCommandLostError("connection stopped"))
    this.setState("closed")
  }

  /**
   * Sends confirm or cancel over the socket and resolves with the snapshot
   * of the `ack`. Rejects with the command error the server answered, with
   * InheritSocketUnavailableError when the socket is not open (use HTTP), or
   * with InheritCommandLostError when the socket dropped mid-command.
   */
  send(command: InheritJobCommand): Promise<InheritJob> {
    const socket = this.socket
    if (!this.isLive || !socket) {
      return Promise.reject(new InheritSocketUnavailableError())
    }
    if (this.pending) {
      return Promise.reject(new InheritSocketUnavailableError("another command is in flight"))
    }
    const frame = command.type === "confirm"
      ? { type: "confirm", ...toUnlockBody(command) }
      : { type: "cancel" }
    return new Promise<InheritJob>((resolve, reject) => {
      const timer = this.schedule(() => {
        if (this.pending?.timer === timer) {
          this.pending = null
          reject(new InheritCommandLostError("command timed out"))
        }
      }, INHERIT_COMMAND_TIMEOUT_MS)
      this.pending = { action: command.type, resolve, reject, timer }
      try {
        socket.send(JSON.stringify(frame))
      } catch {
        this.pending = null
        this.cancelScheduled(timer)
        reject(new InheritSocketUnavailableError("send failed"))
      }
    })
  }

  /** Feeds a snapshot obtained elsewhere (an HTTP command answer). */
  acceptSnapshot(job: InheritJob): void {
    this.receiveJob(job)
  }

  private setState(state: InheritConnectionState) {
    if (this.state === state) return
    this.state = state
    this.handlers.onState?.(state)
  }

  private schedule(callback: () => void, ms: number): unknown {
    return (this.deps.setTimer ?? ((fn, delay) => setTimeout(fn, delay)))(callback, ms)
  }

  private cancelScheduled(handle: unknown) {
    if (handle == null) return
    ;(this.deps.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)))(handle)
  }

  private clearTimer(name: "reconnectTimer" | "pollTimer" | "silenceTimer") {
    this.cancelScheduled(this[name])
    this[name] = null
  }

  private receiveJob(job: InheritJob) {
    if (this.stopped) return
    this.handlers.onJob(job)
    if (isTerminalJobStatus(job.status)) {
      this.finished = true
      this.clearTimer("pollTimer")
      this.clearTimer("reconnectTimer")
    }
  }

  private gone() {
    if (this.stopped) return
    this.handlers.onGone?.()
    this.stop()
  }

  private async connect(): Promise<void> {
    if (this.stopped || this.finished) return
    this.clearTimer("reconnectTimer")
    const generation = ++this.generation
    this.setState(this.failures === 0 && this.state === "connecting" ? "connecting" : this.failures >= FAILURES_BEFORE_POLLING ? "polling" : "reconnecting")

    let ticket: string
    try {
      ticket = await this.deps.fetchTicket(this.jobId)
    } catch (error) {
      if (generation !== this.generation || this.stopped) return
      if (this.deps.errorCode(error) === "job_not_found") {
        this.gone()
        return
      }
      this.handleConnectFailure()
      return
    }
    if (generation !== this.generation || this.stopped) return

    let socket: InheritSocketLike | null
    try {
      socket = this.deps.createSocket(this.deps.socketUrl(this.jobId, ticket))
    } catch {
      socket = null
    }
    if (!socket) {
      // No WebSocket in this environment: polling is all there is.
      this.failures = FAILURES_BEFORE_POLLING
      this.setState("polling")
      this.ensurePolling(true)
      return
    }
    this.socket = socket
    let opened = false

    socket.onopen = () => {
      if (generation !== this.generation) return
      opened = true
      this.failures = 0
      this.clearTimer("pollTimer")
      this.setState("live")
      this.armSilenceTimer(generation)
    }
    socket.onmessage = (event) => {
      if (generation !== this.generation) return
      this.armSilenceTimer(generation)
      this.handleFrame(event.data)
    }
    socket.onerror = () => {
      // A close event always follows; reconnecting happens there.
    }
    socket.onclose = () => {
      if (generation !== this.generation) return
      this.socket = null
      this.clearTimer("silenceTimer")
      this.failPending(new InheritCommandLostError())
      if (this.stopped) return
      if (this.finished) {
        this.setState("closed")
        return
      }
      if (!opened) {
        this.handleConnectFailure()
        return
      }
      // A socket that worked and dropped (network change, server restart, a
      // subscriber too slow): try again at once, poll meanwhile.
      this.failures = 1
      this.setState("reconnecting")
      this.ensurePolling(true)
      this.reconnectTimer = this.schedule(() => void this.connect(), INHERIT_RECONNECT_DELAYS_MS[0])
    }
  }

  private handleConnectFailure() {
    if (this.stopped || this.finished) return
    this.failures += 1
    this.setState(this.failures >= FAILURES_BEFORE_POLLING ? "polling" : "reconnecting")
    this.ensurePolling(true)
    const delay = INHERIT_RECONNECT_DELAYS_MS[Math.min(this.failures - 1, INHERIT_RECONNECT_DELAYS_MS.length - 1)]
    this.clearTimer("reconnectTimer")
    this.reconnectTimer = this.schedule(() => void this.connect(), delay)
  }

  private armSilenceTimer(generation: number) {
    this.clearTimer("silenceTimer")
    this.silenceTimer = this.schedule(() => {
      if (generation !== this.generation) return
      // Closing fires onclose, which reconnects.
      try {
        this.socket?.close(4000, "silent")
      } catch {
        // already closed
      }
    }, INHERIT_SOCKET_SILENCE_MS)
  }

  private ensurePolling(immediate: boolean) {
    if (this.pollTimer != null || this.stopped || this.finished) return
    // Re-read on every use: the socket may have come up while a request was out.
    const shouldPoll = () => !this.stopped && !this.finished && this.state !== "live"
    const tick = async () => {
      this.pollTimer = null
      if (!shouldPoll()) return
      try {
        const job = await this.deps.fetchSnapshot(this.jobId)
        if (shouldPoll()) this.receiveJob(job)
      } catch (error) {
        if (this.deps.errorCode(error) === "job_not_found") {
          this.gone()
          return
        }
      }
      if (shouldPoll() && this.pollTimer == null) {
        this.pollTimer = this.schedule(() => void tick(), INHERIT_POLL_INTERVAL_MS)
      }
    }
    this.pollTimer = this.schedule(() => void tick(), immediate ? 0 : INHERIT_POLL_INTERVAL_MS)
  }

  private handleFrame(data: unknown) {
    if (typeof data !== "string") return
    let frame: Record<string, unknown> | null
    try {
      frame = asRecord(JSON.parse(data))
    } catch {
      return
    }
    if (!frame) return
    switch (frame.type) {
      case "snapshot":
      case "event":
      case "ack": {
        const event = frame.type === "event" ? readEvent(frame.event) : null
        if (event) this.handlers.onEvent?.(event)
        const job = normalizeInheritJob(frame.job)
        if (job) this.receiveJob(job)
        if (frame.type === "ack" && this.pending && this.pending.action === frame.action && job) {
          const pending = this.pending
          this.pending = null
          this.cancelScheduled(pending.timer)
          pending.resolve(job)
        }
        return
      }
      case "error": {
        const code = typeof frame.code === "string" ? frame.code : ""
        const message = typeof frame.message === "string" ? frame.message : ""
        if (this.pending && (frame.action === this.pending.action || !frame.action)) {
          const pending = this.pending
          this.pending = null
          this.cancelScheduled(pending.timer)
          pending.reject(this.deps.commandError({ code, message }))
          return
        }
        if (code === "job_not_found") this.gone()
        return
      }
      case "ping":
        try {
          this.socket?.send(JSON.stringify({ type: "pong" }))
        } catch {
          // the close handler deals with a dead socket
        }
        return
      default:
        return
    }
  }

  private failPending(error: Error) {
    const pending = this.pending
    if (!pending) return
    this.pending = null
    this.cancelScheduled(pending.timer)
    pending.reject(error)
  }

  private teardownSocket() {
    const socket = this.socket
    this.socket = null
    this.generation += 1
    this.clearTimer("silenceTimer")
    if (!socket) return
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    try {
      socket.close(1000, "done")
    } catch {
      // already closed
    }
  }
}
