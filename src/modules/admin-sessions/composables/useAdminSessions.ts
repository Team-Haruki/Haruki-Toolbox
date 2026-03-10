import { onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { reauthAdmin } from "@/modules/admin-sessions/api/reauth"
import { deleteAdminSession, getAdminSessions } from "@/modules/admin-sessions/api/sessions"
import type { AdminSession } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useAdminSessions() {
  const { t, locale } = useI18n()
  const loading = ref(true)
  const sessions = ref<AdminSession[]>([])
  const actionLoading = ref(false)

  async function loadSessions() {
    loading.value = true
    try {
      sessions.value = await getAdminSessions()
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminSessions.toast.loadFailedTitle"),
        error,
        t("adminSessions.toast.loadFailedFallback")
      )
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(sessionTokenId: string) {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
      await deleteAdminSession(sessionTokenId)
      toast.success(t("adminSessions.toast.deleteSuccess"))
      await loadSessions()
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
