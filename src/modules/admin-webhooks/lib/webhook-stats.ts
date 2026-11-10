import type { AdminWebhookEndpoint, AdminWebhookSubscriber } from "@/types/admin"

/**
 * The numbers behind the webhook page's stat panel and the subscriber
 * dialog's breakdown. Everything is counted from the endpoint list and the
 * subscriber list the page loaded. The backend keeps no delivery log, so
 * there is no success or failure figure to show.
 */

export type KeyCount = { key: string; count: number }

export type WebhookEndpointSummary = {
  /** Endpoints in the list that was loaded. */
  loaded: number
  enabled: number
  disabled: number
  /** Subscriptions across all loaded endpoints. */
  subscriptions: number
  /** Subscriptions on enabled endpoints: the ones a callback can reach. */
  reachableSubscriptions: number
  /** Endpoints with at least one subscriber. */
  withSubscribers: number
  /** Endpoints that send an `Authorization: Bearer` header. */
  withBearer: number
}

type ListedEndpoint = Pick<AdminWebhookEndpoint, "enabled" | "subscriptionCount" | "bearer">

function subscriptionCountOf(endpoint: Pick<AdminWebhookEndpoint, "subscriptionCount">): number {
  return Number.isFinite(endpoint.subscriptionCount) && endpoint.subscriptionCount > 0 ? endpoint.subscriptionCount : 0
}

export function summarizeWebhookEndpoints(endpoints: readonly ListedEndpoint[]): WebhookEndpointSummary {
  const summary: WebhookEndpointSummary = {
    loaded: endpoints.length,
    enabled: 0,
    disabled: 0,
    subscriptions: 0,
    reachableSubscriptions: 0,
    withSubscribers: 0,
    withBearer: 0,
  }
  for (const endpoint of endpoints) {
    const subscriptions = subscriptionCountOf(endpoint)
    summary.subscriptions += subscriptions
    if (endpoint.enabled) {
      summary.enabled += 1
      summary.reachableSubscriptions += subscriptions
    } else {
      summary.disabled += 1
    }
    if (subscriptions > 0) {
      summary.withSubscribers += 1
    }
    if (endpoint.bearer.trim() !== "") {
      summary.withBearer += 1
    }
  }
  return summary
}

export type RankedEndpoint = { id: string; callbackUrl: string; enabled: boolean; count: number }

/**
 * The endpoints with subscribers, most subscribed first (ties by id), cut to
 * `limit`. `rest` is the subscription count of the ones cut off.
 */
export function rankEndpointsBySubscriptions(
  endpoints: readonly Pick<AdminWebhookEndpoint, "id" | "callbackUrl" | "enabled" | "subscriptionCount">[],
  limit: number,
): { top: RankedEndpoint[]; rest: number } {
  const ranked = endpoints
    .map((endpoint) => ({
      id: endpoint.id,
      callbackUrl: endpoint.callbackUrl,
      enabled: endpoint.enabled,
      count: subscriptionCountOf(endpoint),
    }))
    .filter((endpoint) => endpoint.count > 0)
    .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id, undefined, { numeric: true }))
  const size = Math.max(0, Math.floor(limit))
  return {
    top: ranked.slice(0, size),
    rest: ranked.slice(size).reduce((sum, endpoint) => sum + endpoint.count, 0),
  }
}

export type WebhookSubscriberSummary = {
  total: number
  /** Distinct toolbox users among the subscriptions. */
  users: number
  byServer: KeyCount[]
  byDataType: KeyCount[]
}

function countBy<T>(rows: readonly T[], read: (row: T) => string): KeyCount[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = read(row).trim().toLowerCase()
    if (key) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key))
}

export function summarizeWebhookSubscribers(
  subscribers: readonly Pick<AdminWebhookSubscriber, "userId" | "server" | "dataType">[],
): WebhookSubscriberSummary {
  return {
    total: subscribers.length,
    users: new Set(subscribers.map((subscriber) => subscriber.userId)).size,
    byServer: countBy(subscribers, (subscriber) => subscriber.server),
    byDataType: countBy(subscribers, (subscriber) => subscriber.dataType),
  }
}
