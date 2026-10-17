import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { beginAfdianBinding, getAfdianBinding, unlinkAfdianBinding, type AfdianBinding } from "@/modules/user-settings/api/sponsor"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"

export function useAfdianBinding() {
  const { t } = useI18n()
  const user = useUserStore()
  const status = ref<AfdianBinding | null>(null)
  const loading = ref(false)
  const busy = ref(false)
  const failed = ref(false)
  const unlinkOpen = ref(false)

  async function refresh() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || loading.value) return
    loading.value = true
    failed.value = false
    try { status.value = await getAfdianBinding(id) } catch { failed.value = true }
    finally { loading.value = false }
  }

  async function bind() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || busy.value) return
    busy.value = true
    try { window.location.assign(await beginAfdianBinding(id)) }
    catch { toast.error(t("userSettings.afdian.actionFailed")); busy.value = false }
  }

  async function unlink() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || busy.value) return
    busy.value = true
    try {
      status.value = await unlinkAfdianBinding(id)
      unlinkOpen.value = false
      toast.success(t("userSettings.afdian.unlinked"))
    } catch { toast.error(t("userSettings.afdian.actionFailed")) }
    finally { busy.value = false }
  }

  onMounted(refresh)
  return { status, loading, busy, failed, unlinkOpen, refresh, bind, unlink }
}
