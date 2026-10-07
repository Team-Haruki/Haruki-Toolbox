// Ported from Sekai Station (github.com/sekai-station, MIT © middlered),
// frontend src/utils/types.ts. Shapes follow the Mafuyu v2 API: a room event
// carries exactly what /recent returns for one room.

export interface StationRoomInfo {
  /** "@user" on X, nickname or "QQ:<number>" on QQ; may be empty */
  handle: string
  /** The original post; empty when there is none (QQ) */
  url: string
  /** null when the room has no avatar or the server does not send avatars */
  avatar: string | null
}

export interface StationRoom {
  /** Unix seconds */
  time: number
  /** Five-digit room number */
  id: string
  msg: string
  name: string
  /** Platform the room came from ("x", "qq", …); empty when unknown */
  source: string
  info: StationRoomInfo
}

export interface StationRoomExtra {
  id: string
  time: number
  data: number[]
}

export interface StationStatistic {
  online: number
  past15m: number
}

export type StationFilterMode = "blacklist" | "whitelist"

/** A room as listed: pinned rooms come from storage, the rest from the stream */
export interface StationDisplayEntry {
  key: string
  room: StationRoom
}

/** A room number is reused, so the post time is part of the identity */
export function roomKey(room: Pick<StationRoom, "id" | "time">): string {
  return `${room.id}-${room.time}`
}
