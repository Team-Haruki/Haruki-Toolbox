import { describe, expect, test } from "bun:test"
import { matchExpansionMemory, serializeExpansionMemory, type ExpansionMemoryScope } from "./expansion-memory"

const scope: ExpansionMemoryScope = { region: "cn", eventId: "184", mode: "normal", worldBloomCharacterId: null }

describe("expansion memory", () => {
  test("round-trips the row key for the same scope", () => {
    const raw = serializeExpansionMemory(scope, "user:123")
    expect(matchExpansionMemory(raw, scope)).toBe("user:123")
    expect(matchExpansionMemory(serializeExpansionMemory(scope, "rank:37"), scope)).toBe("rank:37")
  })

  test("a different scope gets nothing back", () => {
    const raw = serializeExpansionMemory(scope, "user:123")
    expect(matchExpansionMemory(raw, { ...scope, region: "jp" })).toBeNull()
    expect(matchExpansionMemory(raw, { ...scope, eventId: "185" })).toBeNull()
    expect(matchExpansionMemory(raw, { ...scope, mode: "world_bloom" })).toBeNull()
    expect(matchExpansionMemory(raw, { ...scope, worldBloomCharacterId: "5" })).toBeNull()
  })

  test("treats a missing chapter and a null chapter alike", () => {
    const raw = JSON.stringify({ region: "cn", eventId: "184", mode: "normal", key: "rank:5" })
    expect(matchExpansionMemory(raw, scope)).toBe("rank:5")
  })

  test("rejects empty, malformed and foreign payloads", () => {
    expect(matchExpansionMemory(null, scope)).toBeNull()
    expect(matchExpansionMemory("", scope)).toBeNull()
    expect(matchExpansionMemory("{not json", scope)).toBeNull()
    expect(matchExpansionMemory("42", scope)).toBeNull()
    expect(matchExpansionMemory(JSON.stringify({ ...scope, key: "bogus:1" }), scope)).toBeNull()
    expect(matchExpansionMemory(JSON.stringify({ ...scope, key: 7 }), scope)).toBeNull()
  })
})
