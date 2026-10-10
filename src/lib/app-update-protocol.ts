/**
 * Messages exchanged between the page (`src/pwa.ts`) and the Service Worker
 * (`src/sw.ts`). Shared by both builds, so this file must stay free of DOM- or
 * worker-only APIs.
 *
 * Pages announce themselves with `hello` when they start and whenever a new
 * worker takes control; the worker remembers those client ids. After a new
 * worker activates it sends `probe` to every window it does not know, and a
 * page running this code answers with `ack`. A window that never answers is
 * running a build that predates this protocol: its own update logic can leave
 * it on a stale build indefinitely, so the worker reloads it.
 */
export const APP_UPDATE_MESSAGE_HELLO = "haruki-app-update:hello"
export const APP_UPDATE_MESSAGE_PROBE = "haruki-app-update:probe"
export const APP_UPDATE_MESSAGE_ACK = "haruki-app-update:ack"
/** What workbox-window (the pre-9.9 update prompt) posts to a waiting worker. */
export const APP_UPDATE_MESSAGE_SKIP_WAITING = "SKIP_WAITING"

export type AppUpdateClientBuild = {
  version: string
  gitCommit: string
}

export type AppUpdateMessage =
  | { type: typeof APP_UPDATE_MESSAGE_HELLO, build: AppUpdateClientBuild }
  | { type: typeof APP_UPDATE_MESSAGE_PROBE }
  | { type: typeof APP_UPDATE_MESSAGE_ACK, build: AppUpdateClientBuild }
  | { type: typeof APP_UPDATE_MESSAGE_SKIP_WAITING }

const MESSAGE_TYPES: ReadonlySet<string> = new Set([
  APP_UPDATE_MESSAGE_HELLO,
  APP_UPDATE_MESSAGE_PROBE,
  APP_UPDATE_MESSAGE_ACK,
  APP_UPDATE_MESSAGE_SKIP_WAITING,
])

export function readAppUpdateMessage(data: unknown): AppUpdateMessage | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const type = (data as { type?: unknown }).type
  if (typeof type !== "string" || !MESSAGE_TYPES.has(type)) {
    return null
  }

  if (type === APP_UPDATE_MESSAGE_HELLO || type === APP_UPDATE_MESSAGE_ACK) {
    const build = (data as { build?: unknown }).build as Partial<Record<keyof AppUpdateClientBuild, unknown>> | null
    if (!build || typeof build !== "object" || typeof build.version !== "string" || typeof build.gitCommit !== "string") {
      return null
    }
  }

  return data as AppUpdateMessage
}
