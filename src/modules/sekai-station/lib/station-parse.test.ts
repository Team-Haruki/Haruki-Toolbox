import { describe, expect, it } from "bun:test"
import {
  parseHeartbeat,
  parseJson,
  parseRoom,
  parseRoomExtra,
  parseStatistic,
  sanitizeBlocks,
  sanitizePins,
  webUrl,
} from "./station-parse"

// The room example from the Mafuyu API documentation (API.md, "Rooms")
const DOC_ROOM = {
  time: 1777083784,
  id: "01234",
  msg: "Room message",
  name: "Player",
  source: "x",
  info: { handle: "@player", url: "https://x.com/player/status/123", avatar: null },
}

describe("parseRoom", () => {
  it("accepts the documented v2 room", () => {
    expect(parseRoom(DOC_ROOM)).toEqual(DOC_ROOM)
  })

  it("rejects anything that is not a room object", () => {
    expect(parseRoom(null)).toBeNull()
    expect(parseRoom("01234")).toBeNull()
    // The legacy array wire format is not supported
    expect(parseRoom(["room", 1777083784, "01234", "msg", "name", "qq", ["QQInfo", -1, "n", ""]])).toBeNull()
    expect(parseRoom({ ...DOC_ROOM, id: 1234 })).toBeNull()
    expect(parseRoom({ ...DOC_ROOM, time: "1777083784" })).toBeNull()
    expect(parseRoom({ ...DOC_ROOM, time: Number.NaN })).toBeNull()
  })

  it("fills missing text fields and info with empty values", () => {
    expect(parseRoom({ id: "01234", time: 1 })).toEqual({
      time: 1,
      id: "01234",
      msg: "",
      name: "",
      source: "",
      info: { handle: "", url: "", avatar: null },
    })
  })

  it("keeps only web links for url and avatar", () => {
    const room = parseRoom({ ...DOC_ROOM, info: { handle: " @p ", url: "javascript:alert(1)", avatar: "data:image/png;base64,AAA" } })
    expect(room?.info).toEqual({ handle: "@p", url: "", avatar: null })
    expect(parseRoom({ ...DOC_ROOM, info: { handle: "", url: "", avatar: "https://a.example/b.png" } })?.info.avatar).toBe("https://a.example/b.png")
  })

  it("trims the source", () => {
    expect(parseRoom({ ...DOC_ROOM, source: " qq " })?.source).toBe("qq")
    expect(parseRoom({ ...DOC_ROOM, source: null })?.source).toBe("")
  })
})

describe("event payloads", () => {
  it("parses statistic, heartbeat and roomExtra", () => {
    expect(parseStatistic({ online: 12, past15m: 31 })).toEqual({ online: 12, past15m: 31 })
    expect(parseStatistic({ online: 12 })).toBeNull()
    expect(parseHeartbeat({ time: 1777083784000 })).toBe(1777083784000)
    expect(parseHeartbeat({})).toBeNull()
    expect(parseRoomExtra({ id: "01234", time: 1777083784, data: [123, "x", 134] })).toEqual({
      id: "01234",
      time: 1777083784,
      data: [123, 134],
    })
    expect(parseRoomExtra({ id: "01234", data: "nope" })).toBeNull()
  })

  it("never throws on malformed JSON", () => {
    expect(parseJson("{")).toBeUndefined()
    expect(parseJson("{\"a\":1}")).toEqual({ a: 1 })
  })

  it("webUrl keeps http and https only", () => {
    expect(webUrl("HTTPS://x.com")).toBe("HTTPS://x.com")
    expect(webUrl("ftp://x.com")).toBe("")
    expect(webUrl(42)).toBe("")
  })
})

describe("restored from storage", () => {
  it("keeps only well-formed pins", () => {
    const pin = { room: DOC_ROOM, pinnedAt: 5 }
    expect(sanitizePins({ a: pin })).toEqual({ a: pin })
    expect(sanitizePins(null)).toEqual({})
    expect(sanitizePins(5)).toEqual({})
    expect(sanitizePins([pin])).toEqual({})
    expect(sanitizePins({
      a: pin,
      noRoom: { pinnedAt: 5 },
      badRoom: { room: { id: 1 }, pinnedAt: 5 },
      noTime: { room: DOC_ROOM },
      nanTime: { room: DOC_ROOM, pinnedAt: Number.NaN },
      empty: null,
    })).toEqual({ a: pin })
  })

  it("keeps only finite block end times, capped at a fresh block's length", () => {
    const now = 1_000_000
    expect(sanitizeBlocks({ "11111": now + 60_000 }, now)).toEqual({ "11111": now + 60_000 })
    expect(sanitizeBlocks(null, now)).toEqual({})
    expect(sanitizeBlocks(["11111"], now)).toEqual({})
    expect(sanitizeBlocks({ "11111": "soon", "22222": Number.NaN, "33333": null }, now)).toEqual({})
    // A block made while the clock was far ahead ends no later than a new one would
    expect(sanitizeBlocks({ "11111": now + 60 * 86_400_000 }, now)).toEqual({ "11111": now + 10 * 60_000 })
  })
})
