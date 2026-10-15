import { expect, test } from "bun:test"
import { ref, shallowRef } from "vue"
import { AxiosError, AxiosHeaders } from "axios"
import { useUserDataPageState } from "./use-user-data-page-state"
import type { UserSuiteStatus } from "./use-user-suite"

test("missing uploads remain actionable while master data loads and clear on retry", () => {
  const config = { url: "/api/user/u/game-account/jp/123/suite", headers: new AxiosHeaders() }
  const error = shallowRef<unknown>(new AxiosError("HTTP 404", undefined, config, undefined, {
    status: 404, statusText: "Not Found", config, headers: new AxiosHeaders(), data: { message: "Player data not found." },
  }))
  const status = ref<UserSuiteStatus>("error")
  const masterLoading = ref(true)
  const state = useUserDataPageState({ status, error, masterLoading, masterError: ref(null) })
  expect(state.suiteDataMissing.value).toBe(true)
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

test("normal source and master failures retain their details and priority", () => {
  const error = shallowRef<unknown>(new Error("profile unavailable"))
  const masterError = ref<string | null>("master unavailable")
  const state = useUserDataPageState({ status: ref("error"), error, masterLoading: ref(false), masterError })
  expect(state.suiteDataMissing.value).toBe(false)
  expect(state.errorDetail.value).toBe("master unavailable")
  masterError.value = null
  expect(state.errorDetail.value).toBe("profile unavailable")
  error.value = "unexpected response"
  expect(state.errorDetail.value).toBe("unexpected response")
  error.value = null
  expect(state.errorDetail.value).toBeNull()
})
