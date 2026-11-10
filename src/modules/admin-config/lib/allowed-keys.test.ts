import { describe, expect, it } from "bun:test"
import {
  EMPTY_ALLOWED_KEYS_DRAFT,
  addAllowedKeys,
  applyAllowedKeysDraft,
  isAllowedKeysDraftDirty,
  readAllowedKeys,
  removeAllowedKey,
  restoreAllowedKey,
  splitKeyInput,
} from "./allowed-keys"

const BASELINE = ["userCards", "userDecks", "userMusics"]

describe("readAllowedKeys", () => {
  it("reads the backend body, trimming and dropping duplicates and non-strings", () => {
    expect(readAllowedKeys({ publicApiAllowedKeys: ["userCards", " userDecks ", "userCards", "", 3, null] }))
      .toEqual(["userCards", "userDecks"])
  })

  it("accepts a bare array and reads anything else as empty", () => {
    expect(readAllowedKeys(["a", "b"])).toEqual(["a", "b"])
    expect(readAllowedKeys({ publicApiAllowedKeys: null })).toEqual([])
    expect(readAllowedKeys({ userCards: "x" })).toEqual([])
    expect(readAllowedKeys(null)).toEqual([])
    expect(readAllowedKeys("userCards")).toEqual([])
  })
})

describe("splitKeyInput", () => {
  it("splits on commas, semicolons, whitespace and their full-width forms", () => {
    expect(splitKeyInput(" userCards, userDecks;userAreas\nuserHonors，userEvents；userMusics、userCards ")).toEqual([
      "userCards", "userDecks", "userAreas", "userHonors", "userEvents", "userMusics",
    ])
  })

  it("is empty for blank input", () => {
    expect(splitKeyInput("  , ; ")).toEqual([])
  })
})

describe("addAllowedKeys", () => {
  it("appends new keys and reports the ones already listed", () => {
    const result = addAllowedKeys(BASELINE, EMPTY_ALLOWED_KEYS_DRAFT, ["userAreas", "userCards", "userAreas"])
    expect(result.draft).toEqual({ removed: [], added: ["userAreas"] })
    expect(result.duplicates).toEqual(["userCards"])
  })

  it("reports a key that was already added", () => {
    const result = addAllowedKeys(BASELINE, { removed: [], added: ["userAreas"] }, ["userAreas"])
    expect(result.draft.added).toEqual(["userAreas"])
    expect(result.duplicates).toEqual(["userAreas"])
  })

  it("brings a struck-out key back instead of adding it twice", () => {
    const result = addAllowedKeys(BASELINE, { removed: ["userDecks"], added: [] }, ["userDecks"])
    expect(result.draft).toEqual({ removed: [], added: [] })
    expect(result.duplicates).toEqual([])
  })
})

describe("removeAllowedKey / restoreAllowedKey", () => {
  it("drops a new key and strikes out a loaded one", () => {
    const draft = { removed: [], added: ["userAreas"] }
    expect(removeAllowedKey(BASELINE, draft, "userAreas")).toEqual({ removed: [], added: [] })
    expect(removeAllowedKey(BASELINE, draft, "userCards")).toEqual({ removed: ["userCards"], added: ["userAreas"] })
  })

  it("ignores a key that is unknown or already struck out", () => {
    const draft = { removed: ["userCards"], added: [] }
    expect(removeAllowedKey(BASELINE, draft, "userCards")).toBe(draft)
    expect(removeAllowedKey(BASELINE, draft, "nope")).toBe(draft)
  })

  it("restores a struck-out key", () => {
    expect(restoreAllowedKey({ removed: ["userCards", "userDecks"], added: ["x"] }, "userCards"))
      .toEqual({ removed: ["userDecks"], added: ["x"] })
  })
})

describe("applyAllowedKeysDraft", () => {
  it("keeps the loaded order, leaves out struck keys and appends the additions", () => {
    expect(applyAllowedKeysDraft(BASELINE, { removed: ["userDecks"], added: ["userAreas", "userHonors"] }))
      .toEqual(["userCards", "userMusics", "userAreas", "userHonors"])
  })

  it("returns the loaded list for an untouched draft", () => {
    expect(applyAllowedKeysDraft(BASELINE, EMPTY_ALLOWED_KEYS_DRAFT)).toEqual(BASELINE)
  })
})

describe("isAllowedKeysDraftDirty", () => {
  it("is dirty once anything is added or struck out", () => {
    expect(isAllowedKeysDraftDirty(EMPTY_ALLOWED_KEYS_DRAFT)).toBe(false)
    expect(isAllowedKeysDraftDirty({ removed: ["a"], added: [] })).toBe(true)
    expect(isAllowedKeysDraftDirty({ removed: [], added: ["b"] })).toBe(true)
  })
})
