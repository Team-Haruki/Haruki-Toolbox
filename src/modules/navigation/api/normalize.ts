import { asRecord, readOptionalString, readString, readStringArray } from "@/lib/record-utils"
import type { FriendGroupData, FriendGroupItem, FriendLinkItem } from "@/modules/navigation/types"

function unwrapData(payload: unknown): unknown {
  const record = asRecord(payload)
  if (!record) {
    return payload
  }
  return record.updatedData ?? payload
}

export function normalizeList<T>(payload: unknown, normalize: (item: unknown) => T | null): T[] {
  const items = unwrapData(payload)
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => normalize(item))
    .filter((item): item is T => item !== null)
}

export function normalizeFriendLink(item: unknown): FriendLinkItem | null {
  const record = asRecord(item)
  if (!record) {
    return null
  }

  const id = record.id
  const name = readString(record, ["name"]).trim()
  const url = readString(record, ["url"]).trim()
  if (!name || !url || (typeof id !== "string" && typeof id !== "number")) {
    return null
  }

  return {
    id,
    name,
    description: readString(record, ["description"]),
    avatar: readString(record, ["avatar"]),
    url,
    tags: readStringArray(record, ["tags"]),
  }
}

function normalizeFriendGroupItem(item: unknown): FriendGroupItem | null {
  const record = asRecord(item)
  if (!record) {
    return null
  }

  const name = readString(record, ["name"]).trim()
  if (!name) {
    return null
  }

  return {
    name,
    avatar: readString(record, ["avatar"]),
    bg: readString(record, ["bg"]),
    groupInfo: readString(record, ["groupInfo", "group_info"]),
    detail: readString(record, ["detail"]),
    url: readOptionalString(record, ["url"]),
  }
}

export function normalizeFriendGroup(item: unknown): FriendGroupData | null {
  const record = asRecord(item)
  if (!record) {
    return null
  }

  const group = readString(record, ["group"]).trim()
  if (!group) {
    return null
  }

  const groupListRaw = Array.isArray(record.groupList) ? record.groupList : []
  const groupList = groupListRaw
    .map((entry) => normalizeFriendGroupItem(entry))
    .filter((entry): entry is FriendGroupItem => entry !== null)

  return {
    group,
    groupList,
  }
}
