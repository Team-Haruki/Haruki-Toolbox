import { onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { reauthAdmin } from "@/modules/admin-sessions/api/reauth"
import { deleteAdminSession, getAdminSessions } from "@/modules/admin-sessions/api/sessions"
import type { AdminSession } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { extractErrorMessage } from "@/lib/error-utils"

type LoadSessionsOptions = {
  silent?: boolean
  throwOnError?: boolean
}

export function useAdminSessions() {
  const { t, locale } = useI18n()
  const loading = ref(true)
  const sessions = ref<AdminSession[]>([])
  const actionLoading = ref(false)
  let latestLoadRequestId = 0

  async function loadSessions(options: LoadSessionsOptions = {}) {
    const requestId = ++latestLoadRequestId
    const silent = options.silent ?? false
    loading.value = true
    try {
      const data = await getAdminSessions()
      if (requestId !== latestLoadRequestId) return
      sessions.value = data
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      if (!silent) {
        toastErrorWithExtractedMessage(
          t("adminSessions.toast.loadFailedTitle"),
          error,
          t("adminSessions.toast.loadFailedFallback")
        )
      }
      if (options.throwOnError) {
        throw error
      }
    } finally {
      if (requestId !== latestLoadRequestId) return
      loading.value = false
    }
  }

  async function handleDelete(sessionTokenId: string) {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
      await deleteAdminSession(sessionTokenId)
      try {
        await loadSessions({ silent: true, throwOnError: true })
        toast.success(t("adminSessions.toast.deleteSuccess"))
      } catch (error: unknown) {
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminSessions.toast.deleteFailedTitle"),
        error,
        t("adminSessions.toast.deleteFailedFallback")
      )
    } finally {
      actionLoading.value = false
    }
  }

  async function handleReauth() {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
      await reauthAdmin()
      toast.success(t("adminSessions.toast.reauthSuccess"))
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminSessions.toast.reauthFailedTitle"),
        error,
        t("adminSessions.toast.reauthFailedFallback")
      )
    } finally {
      actionLoading.value = false
    }
  }

  function formatDate(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return t("adminSessions.dateFallback")
    }
    return date.toLocaleString(locale.value)
  }

  function formatTtl(ttlSeconds: number) {
    const hours = Math.floor(ttlSeconds / 3600)
    const minutes = Math.floor((ttlSeconds % 3600) / 60)
    return t("adminSessions.ttlFormat", { hours, minutes })
  }

  onMounted(loadSessions)

  return {
    loading,
    sessions,
    actionLoading,
    handleDelete,
    handleReauth,
    formatDate,
    formatTtl,
  }
}
