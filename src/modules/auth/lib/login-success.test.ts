import { describe, expect, it } from "bun:test"
import {
  LOGIN_SUCCESS_STORAGE_KEY,
  consumeLoginSuccessPendingFlag,
  markLoginSuccessPending,
} from "./login-success"

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

describe("login success marker", () => {
  it("requires both the return query and a pending marker", () => {
    const storage = createStorage()

    expect(consumeLoginSuccessPendingFlag(true, storage)).toBe(false)

    markLoginSuccessPending(storage)
    expect(consumeLoginSuccessPendingFlag(false, storage)).toBe(false)
    expect(storage.getItem(LOGIN_SUCCESS_STORAGE_KEY)).toBe("1")

    expect(consumeLoginSuccessPendingFlag(true, storage)).toBe(true)
    expect(storage.getItem(LOGIN_SUCCESS_STORAGE_KEY)).toBeNull()
  })
})
