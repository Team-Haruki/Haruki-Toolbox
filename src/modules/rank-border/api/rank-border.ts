import type { SekaiRegion } from "@/types"
import {
  appendCacheBust,
  formatRankBorderPathSegment,
  normalizeRankBorderBatchTrace,
  normalizeRankBorderGrowths,
  normalizeRankBorderLatest,
  normalizeRankBorderLines,
  normalizeRankBorderStatus,
  normalizeRankBorderTrace,
  normalizeRankBorderUserProfiles,
  normalizeRankBorderWebRankings,
  normalizeTrackerEndpoint,
  type RankBorderGrowth,
  type RankBorderLatest,
  type RankBorderLine,
  type RankBorderMode,
  type RankBorderStatus,
  type RankBorderTracePoint,
  type RankBorderUserProfile,
  type RankBorderWebRankingPage,
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
  full?: boolean
  limit?: number | null
}

export type FetchRankBorderRankParams = RankBorderTrackerScope & {
  rank: string | number
  full?: boolean
  limit?: number | null
}

export type FetchRankBorderWebRankingHistoryParams = RankBorderTrackerScope & {
  rank: string | number
  limit?: number | null
}

export type FetchRankBorderWebRankingsParams = RankBorderTrackerScope & {
  rankMin?: string | number | null
  rankMax?: string | number | null
  limit?: number | null
}

export type FetchRankBorderRanksParams = RankBorderTrackerScope & {
  ranks: Array<string | number>
  full?: boolean
  limit?: number | null
}

export type FetchRankBorderGrowthParams = RankBorderTrackerScope & {
  intervalSeconds: number
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

const TRACKER_WS_OPEN_TIMEOUT_MS = 4_000
const TRACKER_WS_REQUEST_TIMEOUT_MS = 15_000
const TRACKER_WS_FAILURE_COOLDOWN_MS = 30_000
const LOCAL_TRACKER_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"])

type TrackerWsPendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

type TrackerWsError = Error & {
  status?: number
  trackerWsProtocolError?: boolean
}

type TrackerWsTicketResponse = {
  ticket?: unknown
  expiresIn?: unknown
}

type TrackerWsEventHandler = (event: RankBorderRealtimeEvent) => void

const trackerWsClients = new Map<string, TrackerWsClient>()
const trackerWsDisabledUntil = new Map<string, number>()

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

    const socketUrl = await resolveTicketedWebSocketUrl(this.url, this.ticketUrl)
    const socket = new WebSocket(socketUrl)
    this.socket = socket

    const opening = new Promise<void>((resolve, reject) => {
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

export async function fetchRankBorderLines(scope: RankBorderTrackerScope): Promise<RankBorderLine[]> {
  const path = scope.mode === "world_bloom"
    ? buildWorldBloomPath(scope, "world-bloom-ranking-lines", `character/${scope.worldBloomCharacterId}`)
    : buildNormalPath(scope, "ranking-lines")
  return normalizeRankBorderLines(await fetchTrackerJson(scope.endpoint, path, scope.cacheBust, scope.playbackAt, scope.useWebSocket))
}

export async function fetchRankBorderGrowths(params: FetchRankBorderGrowthParams): Promise<RankBorderGrowth[]> {
  const interval = normalizePositiveInteger(params.intervalSeconds)
  const path = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "world-bloom-ranking-score-growth", `character/${params.worldBloomCharacterId}/interval/${interval}`)
    : buildNormalPath(params, `ranking-score-growth/interval/${interval}`)
  return normalizeRankBorderGrowths(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderLatestByUser(params: FetchRankBorderUserParams): Promise<RankBorderLatest | null> {
  const userId = formatRankBorderPathSegment(params.userId)
  const path = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "latest-world-bloom-ranking", `character/${params.worldBloomCharacterId}/user/${userId}`)
    : buildNormalPath(params, `latest-ranking/user/${userId}`)
  return normalizeRankBorderLatest(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderLatestByRank(params: FetchRankBorderRankParams): Promise<RankBorderLatest | null> {
  const rank = normalizePositiveInteger(params.rank)
  const path = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "latest-world-bloom-ranking", `character/${params.worldBloomCharacterId}/rank/${rank}`)
    : buildNormalPath(params, `latest-ranking/rank/${rank}`)
  return normalizeRankBorderLatest(await fetchTrackerJson(params.endpoint, path, params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderWebRankings(params: FetchRankBorderWebRankingsParams): Promise<RankBorderWebRankingPage> {
  if (isContiguousRankWindow(params.rankMin, params.rankMax)) {
    const rankMin = normalizePositiveInteger(params.rankMin)
    const rankMax = normalizePositiveInteger(params.rankMax)
    const limit = normalizeWebRankingLimit(params.limit)
    const ranks = Array.from({ length: Math.min(limit, rankMax - rankMin + 1) }, (_, index) => rankMin + index)
    const items = await mapWithConcurrency(
      ranks,
      8,
      (rank) => fetchRankBorderLatestByRank({ ...params, rank }).catch(() => null),
    )
    return {
      items: items.filter((item): item is RankBorderLatest => item != null),
      nextCursor: null,
    }
  }

  const search = new URLSearchParams()
  const rankMin = params.rankMin != null ? normalizePositiveInteger(params.rankMin) : null
  const rankMax = params.rankMax != null ? normalizePositiveInteger(params.rankMax) : null
  if (rankMin != null) {
    search.set("rankMin", String(rankMin))
  }
  if (rankMax != null) {
    search.set("rankMax", String(rankMax))
  }
  search.set("limit", String(normalizeWebRankingLimit(params.limit)))
  const suffix = params.mode === "world_bloom"
    ? `web/world-bloom-rankings/character/${normalizePositiveInteger(params.worldBloomCharacterId)}`
    : "web/rankings"
  const query = search.toString()
  return normalizeRankBorderWebRankings(await fetchTrackerJson(
    params.endpoint,
    `${buildNormalPath(params, suffix)}${query ? `?${query}` : ""}`,
    params.cacheBust,
    params.playbackAt,
    params.useWebSocket,
  ))
}

export async function fetchRankBorderWebRankingHistoryByRank(params: FetchRankBorderWebRankingHistoryParams): Promise<RankBorderLatest[]> {
  const rank = normalizePositiveInteger(params.rank)
  const search = new URLSearchParams()
  search.set("rankMin", String(rank))
  search.set("rankMax", String(rank))
  search.set("limit", String(normalizeTraceLimit(params.limit) ?? 100_000))
  const suffix = params.mode === "world_bloom"
    ? `web/world-bloom-rankings/character/${normalizePositiveInteger(params.worldBloomCharacterId)}`
    : "web/rankings"
  return normalizeRankBorderWebRankings(await fetchTrackerJson(
    params.endpoint,
    `${buildNormalPath(params, suffix)}?${search}`,
    params.cacheBust,
    params.playbackAt,
    params.useWebSocket,
  )).items
}

export async function fetchRankBorderTraceByRank(params: FetchRankBorderRankParams): Promise<RankBorderTracePoint[]> {
  const rank = normalizePositiveInteger(params.rank)
  const path = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "trace-world-bloom-ranking", `character/${params.worldBloomCharacterId}/rank/${rank}`)
    : buildNormalPath(params, `trace-ranking/rank/${rank}`)
  return normalizeRankBorderTrace(await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderWebTraceByRank(params: FetchRankBorderRankParams): Promise<RankBorderTracePoint[]> {
  const rank = normalizePositiveInteger(params.rank)
  const path = params.mode === "world_bloom"
    ? buildNormalPath(params, `web/trace-world-bloom-ranking/character/${normalizePositiveInteger(params.worldBloomCharacterId)}/rank/${rank}`)
    : buildNormalPath(params, `web/trace-ranking/rank/${rank}`)
  const webRecords = normalizeRankBorderTrace(
    await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket).catch(() => null),
  )
  if (webRecords.length > 0) {
    return webRecords
  }

  return fetchRankBorderTraceByRank(params)
}

export async function fetchRankBorderTraceByRanks(params: FetchRankBorderRanksParams): Promise<Map<number, RankBorderTracePoint[]>> {
  const ranks = Array.from(new Set(params.ranks.map(normalizePositiveInteger)))
  const entries = await Promise.all(
    ranks.map(async (rank) => [rank, await fetchRankBorderTraceByRank({ ...params, rank }).catch(() => [])] as const),
  )
  const result = new Map<number, RankBorderTracePoint[]>()
  for (const [rank, records] of entries) {
    if (records.length > 0) {
      result.set(rank, records)
    }
  }
  return result
}

export async function fetchRankBorderBatchTraceByRanks(params: FetchRankBorderRanksParams): Promise<Map<number, RankBorderTracePoint[]>> {
  const ranks = Array.from(new Set(params.ranks.map(normalizePositiveInteger)))
  const query = ranks.map((rank) => `rank=${encodeURIComponent(rank)}`).join("&")
  const path = params.mode === "world_bloom"
    ? `${buildWorldBloomPath(params, "trace-world-bloom-ranking", `character/${params.worldBloomCharacterId}/ranks`)}?${query}`
    : `${buildNormalPath(params, "trace-ranking/ranks")}?${query}`
  return normalizeRankBorderBatchTrace(await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderTraceByUser(params: FetchRankBorderUserParams): Promise<RankBorderTracePoint[]> {
  const userId = formatRankBorderPathSegment(params.userId)
  const path = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "trace-world-bloom-ranking", `character/${params.worldBloomCharacterId}/user/${userId}`)
    : buildNormalPath(params, `trace-ranking/user/${userId}`)
  return normalizeRankBorderTrace(await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket))
}

export async function fetchRankBorderWebTraceByUser(params: FetchRankBorderUserParams): Promise<RankBorderTracePoint[]> {
  const userId = formatRankBorderPathSegment(params.userId)
  const path = params.mode === "world_bloom"
    ? buildNormalPath(params, `web/trace-world-bloom-ranking/character/${normalizePositiveInteger(params.worldBloomCharacterId)}/user/${userId}`)
    : buildNormalPath(params, `web/trace-ranking/user/${userId}`)
  if (params.full) {
    const webRecords = normalizeRankBorderTrace(
      await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket).catch(() => null),
    )
    if (webRecords.length > 0) {
      return webRecords
    }
  }

  const directPath = params.mode === "world_bloom"
    ? buildWorldBloomPath(params, "trace-world-bloom-ranking", `character/${params.worldBloomCharacterId}/user/${userId}`)
    : buildNormalPath(params, `trace-ranking/user/${userId}`)
  const directRecords = normalizeRankBorderTrace(
    await fetchTrackerJson(params.endpoint, appendTraceQuery(directPath, params), params.cacheBust, params.playbackAt, params.useWebSocket).catch(() => null),
  )
  if (directRecords.length > 0) {
    return directRecords
  }

  return normalizeRankBorderTrace(await fetchTrackerJson(params.endpoint, appendTraceQuery(path, params), params.cacheBust, params.playbackAt, params.useWebSocket))
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
    await fetchTrackerJson(params.endpoint, `${buildNormalPath(params, "web/users")}?${search}`, params.cacheBust, params.playbackAt, params.useWebSocket),
  )
}

export async function fetchRankBorderPublicUserProfile(params: FetchRankBorderPublicUserParams): Promise<RankBorderUserProfile | null> {
  const uniqueId = String(params.uniqueId).trim()
  if (!isPublicUniqueId(uniqueId)) {
    return null
  }

  const directProfile = normalizeRankBorderUserProfiles(
    await fetchTrackerJson(
      params.endpoint,
      buildNormalPath(params, `user-data/${formatRankBorderPathSegment(uniqueId)}`),
      params.cacheBust,
      params.playbackAt,
      params.useWebSocket,
    ).catch(() => null),
  )[0] ?? null
  if (directProfile) {
    return directProfile
  }

  const search = new URLSearchParams()
  search.set("uniqueId", uniqueId)
  search.set("limit", String(normalizeSearchLimit(params.limit)))
  const users = normalizeRankBorderUserProfiles(
    await fetchTrackerJson(params.endpoint, `${buildNormalPath(params, "web/users")}?${search}`, params.cacheBust, params.playbackAt, params.useWebSocket),
  )
  return users.find((user) => user.userId === uniqueId) ?? users[0] ?? null
}

export async function fetchRankBorderStatus(scope: RankBorderTrackerScope): Promise<RankBorderStatus | null> {
  return normalizeRankBorderStatus(await fetchTrackerJson(scope.endpoint, buildNormalPath(scope, "status"), scope.cacheBust, scope.playbackAt, scope.useWebSocket))
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
  if (!wsUrl || isTrackerWsTemporarilyDisabled(wsUrl)) {
    throw new Error("Tracker WebSocket endpoint is unavailable")
  }
  if (!ticketUrl) {
    throw new Error("Tracker WebSocket ticket endpoint is unavailable")
  }

  const client = getTrackerWsClient(wsUrl, ticketUrl)
  try {
    return await client.subscribeRealtime(scope, handler)
  } catch (error) {
    if (!isTrackerWsProtocolError(error)) {
      rememberTrackerWsFailure(wsUrl)
    }
    throw error
  }
}

async function fetchTrackerJson(endpoint: string, path: string, cacheBust = false, playbackAt?: number | null, useWebSocket = false): Promise<unknown> {
  const baseUrl = normalizeTrackerEndpoint(endpoint)
  if (!baseUrl) {
    throw new Error("Tracker endpoint is empty")
  }

  const requestPath = appendPlaybackQuery(path, playbackAt)
  const wsUrl = resolveRankBorderTrackerWebSocketUrl(baseUrl)
  const ticketUrl = resolveRankBorderTrackerWebSocketTicketUrl(baseUrl)
  let wsError: unknown
  if (useWebSocket && wsUrl && ticketUrl && !isTrackerWsTemporarilyDisabled(wsUrl)) {
    try {
      return await requestTrackerJsonViaWebSocket(wsUrl, ticketUrl, requestPath)
    } catch (error) {
      wsError = error
      if (isTrackerWsProtocolError(error) || !shouldAllowTrackerRestFallback(baseUrl)) {
        throw toError(error, "Tracker WebSocket request failed")
      }
      rememberTrackerWsFailure(wsUrl)
    }
  }

  if (!shouldAllowTrackerRestFallback(baseUrl)) {
    throw toError(wsError, "Tracker WebSocket endpoint is unavailable")
  }

  return fetchTrackerJsonViaRest(baseUrl, requestPath, cacheBust)
}

async function fetchTrackerJsonViaRest(baseUrl: string, path: string, cacheBust: boolean): Promise<unknown> {
  const restBaseUrl = resolveRankBorderTrackerRestEndpoint(baseUrl)
  const response = await fetch(appendCacheBust(`${restBaseUrl}${path}`, cacheBust), {
    credentials: "omit",
    cache: "no-store",
  })
  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message || `Tracker request failed: HTTP ${response.status}`)
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
    throw new Error(message || `Tracker WebSocket ticket request failed: HTTP ${response.status}`)
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

function isTrackerWsTemporarilyDisabled(wsUrl: string): boolean {
  const disabledUntil = trackerWsDisabledUntil.get(wsUrl)
  if (!disabledUntil) {
    return false
  }
  if (disabledUntil <= Date.now()) {
    trackerWsDisabledUntil.delete(wsUrl)
    return false
  }

  return true
}

function rememberTrackerWsFailure(wsUrl: string) {
  trackerWsDisabledUntil.set(wsUrl, Date.now() + TRACKER_WS_FAILURE_COOLDOWN_MS)
}

function createTrackerWsProtocolError(message: string, status: number | undefined): TrackerWsError {
  const error = new Error(message) as TrackerWsError
  error.status = status
  error.trackerWsProtocolError = true
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
  return `${basePath}?${search}`
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const value = await response.clone().json()
    if (isRecord(value) && typeof value.error === "string") {
      return value.error
    }
  } catch {
  }

  try {
    return await response.text()
  } catch {
    return ""
  }
}

function buildNormalPath(scope: RankBorderTrackerScope, suffix: string): string {
  return [
    "",
    "event",
    formatRankBorderPathSegment(scope.region),
    normalizePositiveInteger(scope.eventId),
    suffix.replace(/^\/+/, ""),
  ].join("/")
}

function buildWorldBloomPath(scope: RankBorderTrackerScope, category: string, suffix: string): string {
  if (!scope.worldBloomCharacterId || scope.worldBloomCharacterId <= 0) {
    throw new Error("World Bloom character is required")
  }

  return buildNormalPath(scope, `${category}/${suffix}`)
}

function appendTraceQuery(path: string, params: { full?: boolean; limit?: number | null }): string {
  const search = new URLSearchParams(path.includes("?") ? path.slice(path.indexOf("?") + 1) : "")
  const basePath = path.split("?")[0]
  if (params.full) {
    search.set("full", "1")
    search.set("all", "1")
  }
  if (params.limit != null) {
    const limit = normalizeTraceLimit(params.limit)
    if (limit != null) {
      search.set("limit", String(limit))
    }
  }

  const query = search.toString()
  return query ? `${basePath}?${query}` : basePath
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

function normalizeWebRankingLimit(value: unknown): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : 100
}

function normalizeTraceLimit(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : null
}

function normalizePlaybackTimestamp(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isContiguousRankWindow(rankMin: unknown, rankMax: unknown) {
  const min = Number(rankMin)
  const max = Number(rankMax)
  return Number.isInteger(min) && min > 0 && Number.isInteger(max) && max >= min
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  })

  await Promise.all(workers)
  return results
}

function isPublicUniqueId(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
