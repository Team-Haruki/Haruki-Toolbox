import { computed, onMounted, ref, watch } from "vue"
import { isAxiosError } from "axios"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { beginAfdianBinding, getAfdianBinding, unlinkAfdianBinding, verifyAfdianOrder, type AfdianBinding } from "@/modules/user-settings/api/sponsor"
import { shouldReportError } from "@/lib/error-utils"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"

export function useAfdianBinding() {
  const { t } = useI18n()
  const user = useUserStore()
  const status = ref<AfdianBinding | null>(null)
  const loading = ref(false)
  const busy = ref(false)
  const failed = ref(false)
  const unlinkOpen = ref(false)
  const verificationMethod = ref("oauth2")
  const orderNumber = ref("")
  const orderError = ref("")
  const emailVerified = computed(() => user.emailInfo?.verified === true)

  watch(status, (value) => {
    if (!value) return
    if (!value.oauthEnabled) verificationMethod.value = "order"
    else if (!value.orderVerificationEnabled) verificationMethod.value = "oauth2"
  })
  watch(orderNumber, () => { orderError.value = "" })

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
    catch (error) { if (shouldReportError(error)) toast.error(t("userSettings.afdian.actionFailed")); busy.value = false }
  }

  async function verifyOrder() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || busy.value) return
    const number = orderNumber.value.trim()
    if (!/^[0-9]{16,128}$/.test(number)) { orderError.value = t("userSettings.afdian.order.invalid"); return }
    if (!emailVerified.value) { orderError.value = t("userSettings.afdian.order.verifyEmail"); return }
    busy.value = true
    orderError.value = ""
    try {
      status.value = await verifyAfdianOrder(id, number)
      orderNumber.value = ""
      toast.success(t("userSettings.afdian.order.verified"))
    } catch (error) {
      if (!shouldReportError(error)) return
      const code = isAxiosError(error) ? error.response?.status : undefined
      const key = code === 400 ? "rejected" : code === 429 ? "rateLimited" : code === 403 ? "verifyEmail" : "failed"
      orderError.value = t(`userSettings.afdian.order.${key}`)
    } finally { busy.value = false }
  }

  async function unlink() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || busy.value) return
    busy.value = true
    try {
      status.value = await unlinkAfdianBinding(id)
      toast.success(t("userSettings.afdian.unlinked"))
    } finally { busy.value = false }
  }

  onMounted(refresh)
  return { status, loading, busy, failed, unlinkOpen, verificationMethod, orderNumber, orderError, emailVerified, refresh, bind, unlink, verifyOrder }
}
