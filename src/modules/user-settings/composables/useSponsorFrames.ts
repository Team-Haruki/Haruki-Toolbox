import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { getSponsorFrames, saveSponsorFrame, type SponsorFrame, type SponsorFramesData } from "@/modules/user-settings/api/sponsor"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"

export function useSponsorFrames() {
  const { t, locale } = useI18n()
  const user = useUserStore()
  const data = ref<SponsorFramesData | null>(null)
  const loading = ref(false)
  const failed = ref(false)
  const saving = ref(false)
  const accountKey = ref("")
  const selectedId = ref("")
  const search = ref("")
  const preview = ref<"panel" | "profile">("panel")
  const accounts = computed(() => data.value?.accounts ?? [])
  const account = computed(() => accounts.value.find((a) => `${a.server}:${a.gameUserId}` === accountKey.value))
  const selected = computed(() => data.value?.frames.find((f) => f.id === selectedId.value))
  const eligible = computed(() => data.value?.status.eligible === true)
  const dirty = computed(() => selectedId.value !== (account.value?.frameId ?? ""))
  const canSave = computed(() => !!account.value?.verified && dirty.value && (eligible.value || !selectedId.value) && !saving.value)
  const frameName = (frame: SponsorFrame) => frame.name[locale.value] ?? frame.name["zh-CN"] ?? frame.id
  const frames = computed(() => (data.value?.frames ?? []).filter((f) => frameName(f).toLowerCase().includes(search.value.trim().toLowerCase())))
  const previewURL = computed(() => selected.value
    ? (preview.value === "panel" ? selected.value.panelPreview : selected.value.profilePreview)
    : `/sponsor-frames/default-${preview.value}.${preview.value === "panel" ? "png" : "jpg"}`)

  watch(accountKey, () => { selectedId.value = account.value?.frameId ?? "" })

  async function load() {
    const id = resolveRequiredUserId(user.userId)
    if (!id || loading.value) return
    loading.value = true
    failed.value = false
    try {
      data.value = await getSponsorFrames(id)
      if (!account.value) {
        const first = accounts.value.find((a) => a.verified) ?? accounts.value[0]
        accountKey.value = first ? `${first.server}:${first.gameUserId}` : ""
      }
      selectedId.value = account.value?.frameId ?? ""
    } catch { failed.value = true }
    finally { loading.value = false }
  }

  async function save() {
    const id = resolveRequiredUserId(user.userId)
    const target = account.value
    if (!id || !target || !canSave.value) return
    saving.value = true
    const selection = selectedId.value
    try {
      data.value = await saveSponsorFrame(id, target, selection)
      toast.success(t("userSettings.frames.saved"), { description: t("userSettings.frames.savedDescription") })
    } catch { toast.error(t("userSettings.frames.saveFailed")) }
    finally { saving.value = false }
  }

  onMounted(load)
  return { data, loading, failed, saving, accountKey, accounts, account, selectedId, selected, search, preview, previewURL, eligible, dirty, canSave, frameName, frames, load, save }
}
