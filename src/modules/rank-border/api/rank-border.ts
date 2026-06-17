import type { SekaiRegion } from "@/types"
import {
  formatRankBorderPathSegment,
  normalizeRankBorderOverview,
  normalizeRankBorderTrace,
  normalizeRankBorderUserProfiles,
  normalizeRankBorderWebRankDetail,
  normalizeRankBorderWebUserDetail,
  normalizeTrackerEndpoint,
  type RankBorderOverview,
  type RankBorderMode,
  type RankBorderTracePoint,
  type RankBorderUserProfile,
  type RankBorderWebRankDetail,
  type RankBorderWebUserDetail,
} from "../lib/rank-border"

export type RankBorderTrackerScope = {
  endpoint: string
  region: SekaiRegion
  eventId: number
  mode: RankBorderMode
  worldBloomCharacterId?: number | null
  cacheBust?: boolean
  playbackAt?: number | null
  useWebSocket?: boolean
}

export type FetchRankBorderUserParams = RankBorderTrackerScope & {
  userId: string | number
  ownerId?: string | null
  full?: boolean
  limit?: number | null
}

export type FetchRankBorderOverviewParams = RankBorderTrackerScope & {
  intervalSeconds: number
}

export type FetchRankBorderWebDetailParams = RankBorderTrackerScope & {
  rank?: string | number
  userId?: string | number
  intervalSeconds?: number | null
  includeTrace?: boolean
  includePlayerTrace?: boolean
  includeProfile?: boolean
  limit?: number | null
}

export type FetchRankBorderPrivateWebDetailParams = FetchRankBorderWebDetailParams & {
  userId: string | number
  ownerId?: string | null
}

export type FetchRankBorderUserSearchParams = RankBorderTrackerScope & {
  query: string
  limit?: number
}

export type FetchRankBorderPublicUserParams = RankBorderTrackerScope & {
  uniqueId: string
  limit?: number
}

export type RankBorderRealtimeState = "connecting" | "ready" | "closed" | "error"

export type RankBorderRealtimeEvent =
  | {
      type: "state"
      state: RankBorderRealtimeState
      subject?: string | null
      online?: RankBorderRealtimeOnline | null
    }
  | {
      type: "updated"
      server: SekaiRegion
      eventId: number
      timestamp: number | null
    }
  | {
      type: "online"
      server: SekaiRegion
      eventId: number
      online: RankBorderRealtimeOnline
    }

export type RankBorderRealtimeOnline = {
  total: number
  topic: number
}

export type RankBorderRealtimeSubscription = {
  unsubscribe: () => void
}

export type RankBorderTrackerError = Error & {
  status?: number
}

const TRACKER_WS_OPEN_TIMEOUT_MS = 4_000
const TRACKER_WS_REQUEST_TIMEOUT_MS = 15_000
const TRACKER_WS_FAILURE_COOLDOWN_MS = 2_000
const FULL_TRACE_LIMIT = 5_000
const LOCAL_TRACKER_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"])

type TrackerWsPendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

type TrackerWsError = RankBorderTrackerError & {
  trackerWsProtocolError?: boolean
}

type TrackerWsTicketResponse = {
  ticket?: unknown
  expiresIn?: unknown
}

type TrackerWsEventHandler = (event: RankBorderRealtimeEvent) => void
type TrackerWsDisabledState = {
  until: number
  error: Error
}
type TrackerFetchCredentials = RequestCredentials

const trackerWsClients = new Map<string, TrackerWsClient>()
const trackerWsDisabledState = new Map<string, TrackerWsDisabledState>()

class TrackerWsClient {
  private readonly url: string
  private readonly ticketUrl: string
  private socket: WebSocket | null = null
  private opening: Promise<void> | null = null
  private nextId = 1
  private readonly pending = new Map<string, TrackerWsPendingRequest>()
  private readonly eventHandlers = new Set<TrackerWsEventHandler>()

  constructor(url: string, ticketUrl: string) {
    this.url = url
    this.ticketUrl = ticketUrl
  }

  async request(path: string): Promise<unknown> {
    await this.ensureOpen()

    const socket = this.socket
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Tracker WebSocket is not connected")
    }

    const id = `${Date.now().toString(36)}-${this.nextId}`
    this.nextId += 1

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error("Tracker WebSocket request timed out"))
      }, TRACKER_WS_REQUEST_TIMEOUT_MS)

      this.pending.set(id, {
        resolve,
        reject,
        timeoutId,
      })

      try {
        socket.send(JSON.stringify({ id, path }))
      } catch (error) {
        clearTimeout(timeoutId)
        this.pending.delete(id)
        reject(toError(error, "Tracker WebSocket send failed"))
      }
    })
  }

  async subscribeRealtime(
    scope: Pick<RankBorderTrackerScope, "region" | "eventId">,
    handler: TrackerWsEventHandler,
  ): Promise<RankBorderRealtimeSubscription> {
    const eventId = normalizePositiveInteger(scope.eventId)
    this.eventHandlers.add(handler)
    handler({
      type: "state",
      state: "connecting",
    })

    try {
      await this.ensureOpen()
      const data = await this.sendControl({
        type: "subscribe",
        server: scope.region,
        eventId,
      })
      const online = normalizeRealtimeOnline(data)
      handler({
        type: "state",
        state: "ready",
        online,
      })
      if (online) {
        handler({
          type: "online",
          server: scope.region,
          eventId,
          online,
        })
      }
    } catch (error) {
      this.eventHandlers.delete(handler)
      handler({
        type: "state",
        state: "error",
      })
      throw toError(error, "Tracker WebSocket subscription failed")
    }

    let active = true
    return {
      unsubscribe: () => {
        if (!active) {
          return
        }
        active = false
        this.eventHandlers.delete(handler)
        if (this.socket?.readyState === WebSocket.OPEN) {
          void this.sendControl({
            type: "unsubscribe",
            server: scope.region,
            eventId,
          }).catch(() => {})
        }
      },
    }
  }

  private async ensureOpen(): Promise<void> {
    if (typeof WebSocket === "undefined") {
      return Promise.reject(new Error("Tracker WebSocket is unavailable"))
    }

    const current = this.socket
    if (current?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }
    if (current?.readyState === WebSocket.CONNECTING && this.opening) {
      return this.opening
    }
    if (this.opening) {
      return this.opening
    }

    const opening = this.openWithTicket()
    this.opening = opening
    void opening
      .finally(() => {
        if (this.opening === opening) {
          this.opening = null
        }
      })
      .catch(() => {})
    return opening
  }

  private async openWithTicket(): Promise<void> {
    const socketUrl = await resolveTicketedWebSocketUrl(this.url, this.ticketUrl)
    const socket = new WebSocket(socketUrl)
    this.socket = socket

    return new Promise<void>((resolve, reject) => {
      let settled = false
      const timeoutId = setTimeout(() => {
        failOpen("Tracker WebSocket connection timed out")
        socket.close()
      }, TRACKER_WS_OPEN_TIMEOUT_MS)

      const cleanupOpenListeners = () => {
        clearTimeout(timeoutId)
        socket.removeEventListener("open", handleOpen)
        socket.removeEventListener("error", handleOpenError)
      }
      const failOpen = (message: string) => {
        if (settled) {
          return
        }
        settled = true
        cleanupOpenListeners()
        socket.removeEventListener("close", handleClose)
        socket.removeEventListener("message", handleMessage)
        if (this.socket === socket) {
          this.socket = null
        }
        reject(new Error(message))
      }
      const handleOpen = () => {
        if (settled) {
          return
        }
        settled = true
        cleanupOpenListeners()
        resolve()
      }
      const handleOpenError = () => {
        failOpen("Tracker WebSocket connection failed")
      }
      const handleClose = () => {
        if (this.socket === socket) {
          this.socket = null
        }
        failOpen("Tracker WebSocket connection closed")
        this.rejectPending("Tracker WebSocket connection closed")
        this.emitEvent({
          type: "state",
          state: "closed",
        })
      }
      const handleMessage = (event: MessageEvent) => {
        this.handleMessage(event)
      }

      socket.addEventListener("open", handleOpen)
      socket.addEventListener("error", handleOpenError)
      socket.addEventListener("close", handleClose)
      socket.addEventListener("message", handleMessage)
    })
  }

  private handleMessage(event: MessageEvent) {
    if (typeof event.data !== "string") {
      return
    }

    let response: unknown
    try {
      response = JSON.parse(event.data)
    } catch {
      return
    }
    if (!isRecord(response)) {
      return
    }

    if (typeof response.type === "string") {
      this.handleRealtimeEvent(response)
      return
    }

    if (typeof response.id !== "string") {
      return
    }

    const pending = this.pending.get(response.id)
    if (!pending) {
      return
    }

    clearTimeout(pending.timeoutId)
    this.pending.delete(response.id)
    if (response.ok === true) {
      pending.resolve(response.data ?? null)
      return
    }

    pending.reject(createTrackerWsProtocolError(
      typeof response.error === "string" ? response.error : "Tracker WebSocket request failed",
      typeof response.status === "number" ? response.status : undefined,
    ))
  }

  private sendControl(payload: Record<string, unknown>): Promise<unknown> {
    const socket = this.socket
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Tracker WebSocket is not connected"))
    }

    const id = `${Date.now().toString(36)}-${this.nextId}`
    this.nextId += 1

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error("Tracker WebSocket request timed out"))
      }, TRACKER_WS_REQUEST_TIMEOUT_MS)

      this.pending.set(id, {
        resolve,
        reject,
        timeoutId,
      })

      try {
        socket.send(JSON.stringify({ id, ...payload }))
      } catch (error) {
        clearTimeout(timeoutId)
        this.pending.delete(id)
        reject(toError(error, "Tracker WebSocket send failed"))
      }
    })
  }

  private handleRealtimeEvent(response: Record<string, unknown>) {
    if (response.type === "ready") {
      this.emitEvent({
        type: "state",
        state: "ready",
        subject: typeof response.subject === "string" ? response.subject : null,
        online: normalizeRealtimeOnline(response.online),
      })
      return
    }

    if (response.type === "updated") {
      const server = normalizeSekaiRegion(response.server)
      const eventId = normalizeOptionalPositiveInteger(response.eventId)
      if (!server || eventId == null) {
        return
      }
      this.emitEvent({
        type: "updated",
        server,
        eventId,
        timestamp: normalizeOptionalPositiveInteger(response.timestamp),
      })
      return
    }

    if (response.type === "online") {
      const server = normalizeSekaiRegion(response.server)
      const eventId = normalizeOptionalPositiveInteger(response.eventId)
      const online = normalizeRealtimeOnline(response.online)
      if (!server || eventId == null || !online) {
        return
      }
      this.emitEvent({
        type: "online",
        server,
        eventId,
        online,
      })
    }
  }

  private rejectPending(message: string) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeoutId)
      pending.reject(new Error(message))
    }
    this.pending.clear()
  }

  private emitEvent(event: RankBorderRealtimeEvent) {
    for (const handler of this.eventHandlers) {
      handler(event)
    }
  }
}

export async function fetchRankBorderOverview(params: FetchRankBorderOverviewParams): Promise<RankBorderOverview> {
  const interval = normalizePositiveInteger(params.intervalSeconds)
  const search = new URLSearchParams()
  search.set("interval", String(interval))
  const path = `${buildWebLeaderboardV2Path(params, "overview")}?${search}`
  return normalizeRankBorderOverview(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderReplayOverviewV2(params: FetchRankBorderOverviewParams): Promise<RankBorderOverview> {
  const interval = normalizePositiveInteger(params.intervalSeconds)
  const search = new URLSearchParams()
  search.set("interval", String(interval))
  const path = `${buildWebLeaderboardV2Path(params, "replay/overview")}?${search}`
  return normalizeRankBorderOverview(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderWebRankDetailV2(params: FetchRankBorderWebDetailParams & { rank: string | number }): Promise<RankBorderWebRankDetail> {
  const search = new URLSearchParams()
  if (params.intervalSeconds != null) {
    search.set("interval", String(normalizePositiveInteger(params.intervalSeconds)))
  }
  search.set("includeTrace", params.includeTrace ? "true" : "false")
  search.set("includePlayerTrace", params.includePlayerTrace ? "true" : "false")
  const limit = normalizeTraceLimit(params.limit ?? FULL_TRACE_LIMIT)
  if (limit != null) {
    search.set("limit", String(limit))
  }
  const rank = normalizePositiveInteger(params.rank)
  const query = search.toString()
  const path = `${buildWebLeaderboardV2Path(params, `details/rank/${rank}`)}${query ? `?${query}` : ""}`
  return normalizeRankBorderWebRankDetail(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderWebUserDetailV2(params: FetchRankBorderWebDetailParams & { userId: string | number }): Promise<RankBorderWebUserDetail> {
  const search = new URLSearchParams()
  if (params.intervalSeconds != null) {
    search.set("interval", String(normalizePositiveInteger(params.intervalSeconds)))
  }
  search.set("includeTrace", params.includeTrace ? "true" : "false")
  search.set("includeProfile", params.includeProfile ? "true" : "false")
  const limit = normalizeTraceLimit(params.limit ?? FULL_TRACE_LIMIT)
  if (limit != null) {
    search.set("limit", String(limit))
  }
  const userId = formatRankBorderPathSegment(params.userId)
  const query = search.toString()
  const path = `${buildWebLeaderboardV2Path(params, `details/user/${userId}`)}${query ? `?${query}` : ""}`
  return normalizeRankBorderWebUserDetail(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderPrivateWebUserDetailV2(params: FetchRankBorderPrivateWebDetailParams): Promise<RankBorderWebUserDetail> {
  const search = new URLSearchParams()
  if (params.intervalSeconds != null) {
    search.set("interval", String(normalizePositiveInteger(params.intervalSeconds)))
  }
  search.set("includeTrace", params.includeTrace ? "true" : "false")
  search.set("includeProfile", params.includeProfile ? "true" : "false")
  const limit = normalizeTraceLimit(params.limit ?? FULL_TRACE_LIMIT)
  if (limit != null) {
    search.set("limit", String(limit))
  }
  const owner = String(params.ownerId ?? "").trim()
  if (owner) {
    search.set("owner", owner)
  }
  const userId = formatRankBorderPathSegment(params.userId)
  const query = search.toString()
  const path = `${buildWebLeaderboardV2Path(params, `private/details/user/${userId}`)}${query ? `?${query}` : ""}`
  return normalizeRankBorderWebUserDetail(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket, "include"))
}

export async function fetchRankBorderWebTraceByUser(params: FetchRankBorderUserParams): Promise<RankBorderTracePoint[]> {
  const detail = await fetchRankBorderWebUserDetailV2({
    ...params,
    includeTrace: true,
    limit: params.limit ?? (params.full ? FULL_TRACE_LIMIT : null),
  })
  return normalizeRankBorderTrace(detail.playerTrace)
}

export async function fetchRankBorderUserProfiles(params: FetchRankBorderUserSearchParams): Promise<RankBorderUserProfile[]> {
  const query = String(params.query).trim()
  if (query.length < 2 && !isPublicUniqueId(query)) {
    return []
  }

  const search = new URLSearchParams()
  search.set(isPublicUniqueId(query) ? "uniqueId" : "name", query)
  search.set("limit", String(normalizeSearchLimit(params.limit)))
  return normalizeRankBorderUserProfiles(
    await fetchTrackerJson(params.endpoint, `${buildWebLeaderboardV2Path(params, "users/search")}?${search}`, params.cacheBust, params.playbackAt, params.useWebSocket),
  )
}

export async function fetchRankBorderPublicUserProfile(params: FetchRankBorderPublicUserParams): Promise<RankBorderUserProfile | null> {
  const uniqueId = String(params.uniqueId).trim()
  if (!isPublicUniqueId(uniqueId)) {
    return null
  }

  const search = new URLSearchParams()
  search.set("uniqueId", uniqueId)
  search.set("limit", String(normalizeSearchLimit(params.limit)))
  const users = normalizeRankBorderUserProfiles(
    await fetchTrackerJson(params.endpoint, `${buildWebLeaderboardV2Path(params, "users/search")}?${search}`, params.cacheBust, params.playbackAt, params.useWebSocket),
  )
  return users.find((user) => user.userId === uniqueId) ?? users[0] ?? null
}

export async function subscribeRankBorderRealtime(
  scope: Pick<RankBorderTrackerScope, "endpoint" | "region" | "eventId">,
  handler: (event: RankBorderRealtimeEvent) => void,
): Promise<RankBorderRealtimeSubscription> {
  const baseUrl = normalizeTrackerEndpoint(scope.endpoint)
  if (!baseUrl) {
    throw new Error("Tracker endpoint is empty")
  }

  const wsUrl = resolveRankBorderTrackerWebSocketUrl(baseUrl)
  const ticketUrl = resolveRankBorderTrackerWebSocketTicketUrl(baseUrl)
  if (!wsUrl) {
    throw new Error("Tracker WebSocket endpoint is unavailable")
  }
  throwIfTrackerWsTemporarilyDisabled(wsUrl)
  if (!ticketUrl) {
    throw new Error("Tracker WebSocket ticket endpoint is unavailable")
  }

  const client = getTrackerWsClient(wsUrl, ticketUrl)
  try {
    return await client.subscribeRealtime(scope, handler)
  } catch (error) {
    if (!isTrackerWsProtocolError(error)) {
      rememberTrackerWsFailure(wsUrl, error)
    }
    throw error
  }
}

export function isRankBorderTrackerUnauthorizedError(error: unknown): boolean {
  return isRecord(error) && error.status === 401
}

async function fetchTrackerJson(
  endpoint: string,
  path: string,
  _cacheBust = false,
  playbackAt?: number | null,
  useWebSocket = false,
  credentials: TrackerFetchCredentials = "omit",
): Promise<unknown> {
  const baseUrl = normalizeTrackerEndpoint(endpoint)
  if (!baseUrl) {
    throw new Error("Tracker endpoint is empty")
  }

  const requestPath = appendPlaybackQuery(path, playbackAt)
  if (!useWebSocket) {
    return fetchTrackerJsonViaRest(baseUrl, requestPath, credentials)
  }

  const wsUrl = resolveRankBorderTrackerWebSocketUrl(baseUrl)
  const ticketUrl = resolveRankBorderTrackerWebSocketTicketUrl(baseUrl)
  let wsError: unknown
  if (wsUrl && ticketUrl) {
    try {
      throwIfTrackerWsTemporarilyDisabled(wsUrl)
      return await requestTrackerJsonViaWebSocket(wsUrl, ticketUrl, requestPath)
    } catch (error) {
      wsError = error
      if (isTrackerWsProtocolError(error) || !shouldAllowTrackerRestFallback(baseUrl)) {
        throw toError(error, "Tracker WebSocket request failed")
      }
      rememberTrackerWsFailure(wsUrl, error)
    }
  }

  if (!shouldAllowTrackerRestFallback(baseUrl)) {
    throw toError(wsError, "Tracker WebSocket endpoint is unavailable")
  }

  return fetchTrackerJsonViaRest(baseUrl, requestPath, credentials)
}

async function fetchTrackerJsonViaRest(
  baseUrl: string,
  path: string,
  credentials: TrackerFetchCredentials,
): Promise<unknown> {
  const restBaseUrl = resolveRankBorderTrackerRestEndpoint(baseUrl)
  const response = await fetch(`${restBaseUrl}${path}`, {
    credentials,
    cache: "no-store",
  })
  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw createTrackerError(message || `Tracker request failed: HTTP ${response.status}`, response.status)
  }

  return response.json()
}

async function requestTrackerJsonViaWebSocket(wsUrl: string, ticketUrl: string, path: string): Promise<unknown> {
  return getTrackerWsClient(wsUrl, ticketUrl).request(path)
}

function getTrackerWsClient(wsUrl: string, ticketUrl: string): TrackerWsClient {
  const key = `${wsUrl}\n${ticketUrl}`
  let client = trackerWsClients.get(key)
  if (!client) {
    client = new TrackerWsClient(wsUrl, ticketUrl)
    trackerWsClients.set(key, client)
  }

  return client
}

export function resolveRankBorderTrackerWebSocketUrl(endpoint: string, origin = getTrackerOrigin()): string {
  const normalized = normalizeTrackerEndpoint(endpoint)
  if (!normalized) {
    return ""
  }

  try {
    const url = /^wss?:\/\//i.test(normalized)
      ? new URL(normalized)
      : /^https?:\/\//i.test(normalized)
        ? new URL(normalized)
        : new URL(normalized.startsWith("/") ? normalized : `/${normalized}`, origin)
    url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:"
    url.pathname = appendWebSocketPath(url.pathname)
    url.hash = ""
    return url.toString()
  } catch {
    return ""
  }
}

export function resolveRankBorderTrackerWebSocketTicketUrl(endpoint: string, origin = getTrackerOrigin()): string {
  const normalized = normalizeTrackerEndpoint(endpoint)
  if (!normalized) {
    return ""
  }

  try {
    const url = /^wss?:\/\//i.test(normalized)
      ? new URL(normalized)
      : /^https?:\/\//i.test(normalized)
        ? new URL(normalized)
        : new URL(normalized.startsWith("/") ? normalized : `/${normalized}`, origin)
    url.protocol = url.protocol === "wss:" ? "https:" : url.protocol === "ws:" ? "http:" : url.protocol
    url.pathname = appendWebSocketTicketPath(stripWebSocketPath(url.pathname))
    url.hash = ""
    return url.toString()
  } catch {
    return ""
  }
}

async function resolveTicketedWebSocketUrl(wsUrl: string, ticketUrl: string): Promise<string> {
  const ticket = await fetchTrackerWsTicket(ticketUrl)
  return appendWebSocketTicket(wsUrl, ticket)
}

async function fetchTrackerWsTicket(ticketUrl: string): Promise<string> {
  const response = await fetch(ticketUrl, {
    credentials: "include",
    cache: "no-store",
  })
  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw createTrackerError(message || `Tracker WebSocket ticket request failed: HTTP ${response.status}`, response.status)
  }

  const data = await response.json() as TrackerWsTicketResponse
  if (typeof data.ticket !== "string" || data.ticket.trim() === "") {
    throw new Error("Tracker WebSocket ticket response is invalid")
  }
  return data.ticket
}

function appendWebSocketTicket(wsUrl: string, ticket: string): string {
  const url = new URL(wsUrl)
  url.searchParams.set("ticket", ticket)
  return url.toString()
}

function resolveRankBorderTrackerRestEndpoint(endpoint: string): string {
  const normalized = normalizeTrackerEndpoint(endpoint)
  if (!/^wss?:\/\//i.test(normalized)) {
    return normalized
  }

  const url = new URL(normalized)
  url.protocol = url.protocol === "wss:" ? "https:" : "http:"
  url.pathname = stripWebSocketPath(url.pathname)
  url.hash = ""
  return normalizeTrackerEndpoint(url.toString())
}

function appendWebSocketPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  if (trimmed.toLowerCase().endsWith("/ws")) {
    return trimmed || "/ws"
  }

  return `${trimmed}/ws`
}

function appendWebSocketTicketPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  if (trimmed.toLowerCase().endsWith("/ws-ticket")) {
    return trimmed || "/ws-ticket"
  }

  return `${trimmed}/ws-ticket`
}

function stripWebSocketPath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  if (!trimmed.toLowerCase().endsWith("/ws")) {
    return pathname
  }

  return trimmed.slice(0, -3) || "/"
}

function shouldAllowTrackerRestFallback(endpoint: string): boolean {
  return import.meta.env.DEV
    || import.meta.env.VITE_HARUKI_EVENT_TRACKER_ALLOW_REST_FALLBACK === "true"
    || isLocalTrackerEndpoint(endpoint)
}

function isLocalTrackerEndpoint(endpoint: string): boolean {
  try {
    const url = /^https?:\/\//i.test(endpoint) || /^wss?:\/\//i.test(endpoint)
      ? new URL(endpoint)
      : new URL(endpoint.startsWith("/") ? endpoint : `/${endpoint}`, getTrackerOrigin())
    return LOCAL_TRACKER_HOSTS.has(url.hostname) || url.hostname.endsWith(".localhost")
  } catch {
    return false
  }
}

function getTrackerOrigin(): string {
  return typeof window === "undefined" ? "http://localhost" : window.location.href
}

function throwIfTrackerWsTemporarilyDisabled(wsUrl: string) {
  const disabledState = trackerWsDisabledState.get(wsUrl)
  if (!disabledState) {
    return
  }
  if (disabledState.until <= Date.now()) {
    trackerWsDisabledState.delete(wsUrl)
    return
  }

  throw disabledState.error
}

function rememberTrackerWsFailure(wsUrl: string, error: unknown) {
  trackerWsDisabledState.set(wsUrl, {
    until: Date.now() + TRACKER_WS_FAILURE_COOLDOWN_MS,
    error: toError(error, "Tracker WebSocket endpoint is unavailable"),
  })
}

function createTrackerWsProtocolError(message: string, status: number | undefined): TrackerWsError {
  const error = createTrackerError(message, status) as TrackerWsError
  error.trackerWsProtocolError = true
  return error
}

function createTrackerError(message: string, status: number | undefined): RankBorderTrackerError {
  const error = new Error(message) as RankBorderTrackerError
  error.status = status
  return error
}

function isTrackerWsProtocolError(error: unknown): boolean {
  return isRecord(error) && error.trackerWsProtocolError === true
}

function toError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage)
}

function appendPlaybackQuery(path: string, playbackAt: number | null | undefined): string {
  const timestamp = normalizePlaybackTimestamp(playbackAt)
  if (timestamp == null) {
    return path
  }

  const questionIndex = path.indexOf("?")
  const basePath = questionIndex >= 0 ? path.slice(0, questionIndex) : path
  const search = new URLSearchParams(questionIndex >= 0 ? path.slice(questionIndex + 1) : "")
  search.set("at", String(timestamp))
  search.set("timestamp", String(timestamp))
  return `${basePath}?${search}`
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const value = await response.clone().json()
    const message = extractTrackerErrorMessage(value)
    if (message) {
      return message
    }
  } catch {
  }

  try {
    return await response.text()
  } catch {
    return ""
  }
}

function extractTrackerErrorMessage(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null
  }

  if (!isRecord(value)) {
    return null
  }

  const message = readStringField(value, "message")
    ?? readStringField(value, "error_description")
    ?? readStringField(value, "errorDescription")
    ?? readStringField(value, "detail")
  if (message) {
    return message
  }

  const nestedError = value.error
  if (typeof nestedError === "string") {
    return nestedError.trim() || null
  }

  const nestedMessage = extractTrackerErrorMessage(nestedError)
  if (nestedMessage) {
    return nestedMessage
  }

  return readStringField(value, "status")
}

function readStringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function buildWebLeaderboardV2Path(scope: RankBorderTrackerScope, suffix: string): string {
  const base = `/api/v2/web/events/${scope.region}/${normalizePositiveInteger(scope.eventId)}/leaderboards`
  if (scope.mode === "world_bloom") {
    return `${base}/world-bloom/${normalizePositiveInteger(scope.worldBloomCharacterId)}/${suffix}`
  }
  return `${base}/total/${suffix}`
}

function normalizePositiveInteger(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Positive integer is required")
  }

  return parsed
}

function normalizeOptionalPositiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeSekaiRegion(value: unknown): SekaiRegion | null {
  return typeof value === "string" && ["jp", "en", "tw", "cn", "kr"].includes(value)
    ? value as SekaiRegion
    : null
}

function normalizeRealtimeOnline(value: unknown): RankBorderRealtimeOnline | null {
  if (!isRecord(value)) {
    return null
  }

  const total = Number(value.total)
  const topic = Number(value.topic)
  return Number.isFinite(total) && Number.isFinite(topic)
    ? {
        total: Math.max(0, Math.floor(total)),
        topic: Math.max(0, Math.floor(topic)),
      }
    : null
}

function normalizeSearchLimit(value: unknown): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 20) : 5
}

function normalizeTraceLimit(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : null
}

function normalizePlaybackTimestamp(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isPublicUniqueId(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
