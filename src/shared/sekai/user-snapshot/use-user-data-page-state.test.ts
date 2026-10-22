import { beforeAll, expect, test } from "bun:test"
import { ref, shallowRef } from "vue"
import { AxiosError, AxiosHeaders } from "axios"
import { i18n, setI18nLocale } from "@/shared/i18n"
import zhCNCore from "@/shared/i18n/messages/zh-CN/zh-CN-core"
import { useUserDataPageState } from "./use-user-data-page-state"
import type { UserSuiteStatus } from "./use-user-suite"

beforeAll(async () => {
  i18n.global.mergeLocaleMessage("zh-CN", zhCNCore)
  await setI18nLocale("zh-CN")
})

function suiteError(status: number, message: string) {
  const config = { url: "/api/user/u/game-account/jp/123/suite", headers: new AxiosHeaders() }
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, undefined, {
    status, statusText: "", config, headers: new AxiosHeaders(), data: { message },
  })
}

test("missing uploads remain actionable while master data loads and clear on retry", () => {
  const error = shallowRef<unknown>(suiteError(404, "Player data not found."))
  const status = ref<UserSuiteStatus>("error")
  const masterLoading = ref(true)
  const state = useUserDataPageState({ status, error, masterLoading, masterError: ref(null) })
  expect(state.suiteDataMissing.value).toBe(true)
  expect(state.missingDataType.value).toBe("suite")
  expect(state.isLoading.value).toBe(true)
  expect(state.isReady.value).toBe(false)
  error.value = null
  status.value = "loading"
  expect(state.suiteDataMissing.value).toBe(false)
  status.value = "ready"
  masterLoading.value = false
  expect(state.isReady.value).toBe(true)
  expect(state.hasError.value).toBe(false)
})

test("normal source and master failures become user-language text with raw details", () => {
  const error = shallowRef<unknown>(new Error("profile unavailable"))
  const masterError = ref<string | null>("master unavailable")
  const state = useUserDataPageState({
    status: ref("error"), error, masterLoading: ref(false), masterError, fallback: () => "加载失败",
  })
  expect(state.suiteDataMissing.value).toBe(false)
  // A raw master-data message is not user text: it becomes the detail line.
  expect(state.errorMessage.value).toBe("加载失败")
  expect(state.errorDetail.value).toBe("master unavailable")
  masterError.value = null
  // App-code errors already carry their own text.
  expect(state.errorMessage.value).toBe("profile unavailable")
  expect(state.errorDetail.value).toBeNull()
  error.value = null
  expect(state.errorMessage.value).toBeNull()
  expect(state.errorDetail.value).toBeNull()
})

test("transport failures never surface axios wording", () => {
  const config = { url: "/api/user/u/game-account/jp/123/suite", headers: new AxiosHeaders() }
  const error = shallowRef<unknown>(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config))
  const state = useUserDataPageState({
    status: ref("error"), error, masterLoading: ref(false), masterError: ref(null), fallback: () => "加载失败",
  })
  expect(state.errorMessage.value).not.toContain("Network Error")
  expect(state.errorMessage.value).toBe(zhCNCore.core.errors.network)
  expect(state.errorDetail.value).toBeNull()
})

test("a 403 on a granted account is reported as a lapsed grant", () => {
  const error = shallowRef<unknown>(suiteError(403, "forbidden"))
  const account = ref<{ ownership: "own" | "granted" } | null>({ ownership: "granted" })
  const state = useUserDataPageState({
    status: ref("error"), error, masterLoading: ref(false), masterError: ref(null), account, fallback: () => "加载失败",
  })
  expect(state.grantLapsed.value).toBe(true)
  expect(state.errorMessage.value).toBe(zhCNCore.uploadedGameData.grantLapsed)
  account.value = { ownership: "own" }
  expect(state.grantLapsed.value).toBe(false)
  expect(state.errorMessage.value).toBe("加载失败")
})
