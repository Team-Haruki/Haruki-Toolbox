import { describe, expect, it } from "bun:test"
import { buildSelectableGameAccounts, makeGrantedGameAccountKey, normalizeAccessibleGameAccounts } from "./selectable-accounts"
import type { GameAccountBinding } from "@/types/store"

const OWN_BINDING: GameAccountBinding = { server: "jp", userId: 111, verified: true, isDefault: true }
const UNVERIFIED_BINDING: GameAccountBinding = { server: "en", userId: 222, verified: false }

describe("normalizeAccessibleGameAccounts", () => {
  it("normalizes own and granted entries and drops junk", () => {
    const accounts = normalizeAccessibleGameAccounts({
      generatedAt: "2026-08-25T12:00:00Z",
      total: 3,
      accounts: [
        {
          server: "jp",
          gameUserId: "111",
          ownership: "own",
          verified: true,
          isDefault: true,
          capabilities: { suite: {}, mysekai: {}, profile: {}, recommend: {} },
          owner: null,
        },
        {
          server: "jp",
          game_user_id: "999",
          ownership: "granted",
          verified: true,
          is_default: false,
          capabilities: { suite: { expiresAt: "2026-09-30T00:00:00Z" }, recommend: { expires_at: "2026-09-30T00:00:00Z" } },
          owner: { user_id: "owner-1", name: "某某", avatar_path: null },
        },
        { ownership: "granted" },
        "junk",
      ],
    })

    expect(accounts).toHaveLength(2)
    expect(accounts[0]).toMatchObject({ server: "jp", gameUserId: "111", ownership: "own", isDefault: true })
    expect(accounts[0]?.capabilities.suite).toEqual({ expiresAt: null })
    expect(accounts[1]).toMatchObject({ server: "jp", gameUserId: "999", ownership: "granted" })
    expect(accounts[1]?.capabilities.suite?.expiresAt).toBe("2026-09-30T00:00:00Z")
    expect(accounts[1]?.capabilities.recommend?.expiresAt).toBe("2026-09-30T00:00:00Z")
    expect(accounts[1]?.owner).toEqual({ userId: "owner-1", name: "某某", avatarPath: null })
  })

  it("returns an empty list for a malformed payload", () => {
    expect(normalizeAccessibleGameAccounts({})).toEqual([])
    expect(normalizeAccessibleGameAccounts({ accounts: "nope" })).toEqual([])
  })
})

describe("buildSelectableGameAccounts", () => {
  const granted = [
    {
      server: "jp" as const,
      gameUserId: "999",
      ownership: "granted" as const,
      verified: true,
      isDefault: false,
      capabilities: { suite: { expiresAt: "2026-09-30T00:00:00Z" }, recommend: { expiresAt: "2026-09-30T00:00:00Z" } },
      owner: { userId: "owner-1", name: "某某", avatarPath: null },
    },
    {
      server: "jp" as const,
      gameUserId: "888",
      ownership: "granted" as const,
      verified: true,
      isDefault: false,
      capabilities: { mysekai: { expiresAt: "2026-09-01T00:00:00Z" } },
      owner: { userId: "owner-2", name: "另一位", avatarPath: null },
    },
  ]

  it("appends granted accounts after own bindings with namespaced keys", () => {
    const accounts = buildSelectableGameAccounts([OWN_BINDING], granted)
    expect(accounts.map((account) => account.key)).toEqual(["jp:111", "grant:jp:999", "grant:jp:888"])
    expect(accounts[1]?.ownership).toBe("granted")
    expect(accounts[1]?.owner?.name).toBe("某某")
    expect(accounts[1]?.userId).toBe("999")
    expect(makeGrantedGameAccountKey(granted[0]!)).toBe("grant:jp:999")
  })

  it("filters granted accounts by capability but always keeps own bindings", () => {
    const accounts = buildSelectableGameAccounts([OWN_BINDING, UNVERIFIED_BINDING], granted, "suite")
    expect(accounts.map((account) => account.key)).toEqual(["jp:111", "en:222", "grant:jp:999"])
    // Unverified own binding is listed but holds no capabilities.
    expect(accounts[1]?.capabilities.size).toBe(0)
    expect(accounts[0]?.capabilities.has("profile")).toBe(true)

    const profileAccounts = buildSelectableGameAccounts([OWN_BINDING], granted, "profile")
    expect(profileAccounts.map((account) => account.key)).toEqual(["jp:111"])
  })

  it("drops a granted entry that collides with an own binding", () => {
    const colliding = [{ ...granted[0]!, gameUserId: "111" }]
    const accounts = buildSelectableGameAccounts([OWN_BINDING], colliding)
    expect(accounts.map((account) => account.key)).toEqual(["jp:111"])
    expect(accounts[0]?.ownership).toBe("own")
  })

  it("keeps 17-18 digit game uids intact as strings", () => {
    // jp/en uids exceed Number.MAX_SAFE_INTEGER; a Number() round-trip
    // would silently corrupt them.
    const bigUid = "228116651934826499"
    const accounts = buildSelectableGameAccounts([], [{ ...granted[0]!, gameUserId: bigUid }])
    expect(accounts[0]?.userId).toBe(bigUid)
    expect(accounts[0]?.key).toBe(`grant:jp:${bigUid}`)
  })

  it("works without aggregate data (pre-grant behavior)", () => {
    const accounts = buildSelectableGameAccounts([OWN_BINDING], null, "suite")
    expect(accounts.map((account) => account.key)).toEqual(["jp:111"])
  })
})
