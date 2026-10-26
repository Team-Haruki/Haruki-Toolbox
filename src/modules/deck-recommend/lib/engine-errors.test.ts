import { beforeAll, describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders } from "axios"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import zhCNDeck from "@/shared/i18n/messages/zh-CN/zh-CN-deck"
import enUSDeck from "@/shared/i18n/messages/en-US/en-US-deck"
import { DECK_RECOMMEND_ERROR_KEYS, describeDeckRecommendError } from "./engine-errors"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  i18n.global.mergeLocaleMessage("zh-CN", zhCNDeck)
  await setI18nLocale("zh-CN")
})

describe("describeDeckRecommendError", () => {
  test("maps the engine's card shortage to a hint with the count", () => {
    const described = describeDeckRecommendError(new Error("Cannot recommend any deck in 4 cards"))
    expect(described.message).toBe(zhCNDeck.deckRecommend.errors.notEnoughCards.replace("{count}", "4"))
    expect(described.detail).toBe("Cannot recommend any deck in 4 cards")
  })

  test("maps readiness, validation and engine failures", () => {
    expect(describeDeckRecommendError(new Error("master data is not ready")).message).toBe(zhCNDeck.deckRecommend.errors.masterNotReady)
    expect(describeDeckRecommendError(new Error("music metas are not ready")).message).toBe(zhCNDeck.deckRecommend.errors.masterNotReady)
    expect(describeDeckRecommendError(new Error("current deck requires 5 cards")).message).toBe(zhCNDeck.deckRecommend.errors.currentDeckIncomplete)
    expect(describeDeckRecommendError(new Error("music_id is required")).message).toBe(zhCNDeck.deckRecommend.errors.musicRequired)
    expect(describeDeckRecommendError(new Error("wasm engine failed to execute recommendation")).message).toBe(zhCNDeck.deckRecommend.errors.engineFailed)
    expect(describeDeckRecommendError(new Error("Deck recommend worker recommend timed out")).message).toBe(zhCNDeck.deckRecommend.errors.timeout)
    class Exception {}
    expect(describeDeckRecommendError(new Exception()).message).toBe(zhCNDeck.deckRecommend.errors.engineFailed)
  })

  test("routes transport failures through the shared error text", () => {
    const config = { url: "/api/user/1/game-account/jp/1/suite", headers: new AxiosHeaders() }
    const described = describeDeckRecommendError(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config))
    expect(described.message).toBe(zhCNCore.core.errors.network)
    expect(described.message).not.toContain("Network Error")
  })

  test("keeps unknown engine text as a detail under a generic title", () => {
    const described = describeDeckRecommendError(new Error("something odd happened"))
    expect(described.message).toBe(zhCNDeck.deckRecommend.errors.unknown)
    expect(described.detail).toBe("something odd happened")
  })

  test("every producible key exists in both hand-written locales", () => {
    for (const key of DECK_RECOMMEND_ERROR_KEYS) {
      expect(typeof (zhCNDeck.deckRecommend.errors as Record<string, unknown>)[key]).toBe("string")
      expect(typeof (enUSDeck.deckRecommend.errors as Record<string, unknown>)[key]).toBe("string")
    }
  })
})
