import { isSekaiRegion, SEKAI_REGIONS, SEKAI_REGION_LABEL_KEYS } from "@/lib/sekai-region"
import type { SekaiRegion } from "@/types/store"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export const DEFAULT_SERVER: SekaiRegion = "jp"
export const DEFAULT_SORT = "id_desc"
export const FILTER_SERVER_ALL = "all"

export type BindingKeyParts = {
  server: SekaiRegion
  gameUserId: string
}

type ServerFilterOption = {
  value: SekaiRegion | typeof FILTER_SERVER_ALL
  label: string
}

type SortFilterOption = {
  value: string
  label: string
}

const SERVER_VALUES = [FILTER_SERVER_ALL, ...SEKAI_REGIONS] as const

const SERVER_LABEL_KEYS = {
  all: "adminGameBindings.filters.allServers",
  ...SEKAI_REGION_LABEL_KEYS,
} satisfies Record<(typeof SERVER_VALUES)[number], string>

const SORT_VALUES = [
  "id_desc",
  "id_asc",
  "game_user_id_desc",
  "game_user_id_asc",
  "user_id_desc",
  "user_id_asc",
] as const

const SORT_LABEL_KEYS: Record<(typeof SORT_VALUES)[number], string> = {
  id_desc: "adminGameBindings.sort.idDesc",
  id_asc: "adminGameBindings.sort.idAsc",
  game_user_id_desc: "adminGameBindings.sort.gameUserIdDesc",
  game_user_id_asc: "adminGameBindings.sort.gameUserIdAsc",
  user_id_desc: "adminGameBindings.sort.userIdDesc",
  user_id_asc: "adminGameBindings.sort.userIdAsc",
}

export function getServerOptions(t: TranslateFn): ReadonlyArray<ServerFilterOption> {
  return SERVER_VALUES.map((value) => ({
    value,
    label: t(SERVER_LABEL_KEYS[value]),
  }))
}

export function getSortOptions(t: TranslateFn): ReadonlyArray<SortFilterOption> {
  return SORT_VALUES.map((value) => ({
    value,
    label: t(SORT_LABEL_KEYS[value]),
  }))
}

export function toBindingKey(binding: { server: string; gameUserId: string }) {
  return `${binding.server}:${binding.gameUserId}`
}

export function parseBindingKey(key: string): BindingKeyParts | null {
  const separatorIndex = key.indexOf(":")
  if (separatorIndex <= 0 || separatorIndex === key.length - 1) {
    return null
  }

  const server = key.slice(0, separatorIndex)
  if (!isSekaiRegion(server)) {
    return null
  }

  const gameUserId = key.slice(separatorIndex + 1)
  return { server, gameUserId }
}

export function resolveServerLabel(server: string, t: TranslateFn) {
  const key = SERVER_LABEL_KEYS[server as (typeof SERVER_VALUES)[number]]
  return key ? t(key) : server
}
