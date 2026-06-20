import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import {
  listAdminSponsors,
  syncAdminSponsorsFromAfdian,
  updateAdminSponsorProfile,
} from "@/modules/admin-sponsors/api/sponsors"
import type { AdminSponsorProfile, AdminSponsorUpdatePayload } from "@/types/admin"

const DATE_TIME_LOCAL_LENGTH = 16

type SponsorForm = {
  name: string
  avatar: string
  planName: string
  message: string
  source: string
  isActive: boolean
  afdianSyncDisabled: boolean
  paidAt: string
  planExpiresAt: string
}

function toDateTimeLocalValue(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value.slice(0, DATE_TIME_LOCAL_LENGTH)
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.valueOf() - timezoneOffsetMs).toISOString().slice(0, DATE_TIME_LOCAL_LENGTH)
}

function fromDateTimeLocalValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.valueOf()) ? trimmed : date.toISOString()
}

function formFromSponsor(sponsor: AdminSponsorProfile): SponsorForm {
  return {
    name: sponsor.name,
    avatar: sponsor.avatar,
    planName: sponsor.planName,
    message: sponsor.message,
    source: sponsor.source,
    isActive: sponsor.isActive,
    afdianSyncDisabled: sponsor.afdianSyncDisabled,
    paidAt: toDateTimeLocalValue(sponsor.paidAt),
    planExpiresAt: toDateTimeLocalValue(sponsor.planExpiresAt),
  }
}

function createPayload(form: SponsorForm): AdminSponsorUpdatePayload {
  return {
    name: form.name.trim(),
    avatar: form.avatar.trim(),
    planName: form.planName.trim(),
    message: form.message.trim(),
    source: form.source.trim(),
    isActive: form.isActive,
    afdianSyncDisabled: form.afdianSyncDisabled,
    paidAt: fromDateTimeLocalValue(form.paidAt),
    planExpiresAt: fromDateTimeLocalValue(form.planExpiresAt),
  }
}

export function useAdminSponsorManagement() {
  const { t } = useI18n()

  const loading = ref(true)
  const refreshing = ref(false)
  const saving = ref(false)
  const syncing = ref(false)
  const sponsors = ref<AdminSponsorProfile[]>([])
  const generatedAt = ref("")
  const total = ref(0)

  const editOpen = ref(false)
  const editingSponsor = ref<AdminSponsorProfile | null>(null)
  const form = ref<SponsorForm>({
    name: "",
    avatar: "",
    planName: "",
    message: "",
    source: "",
    isActive: false,
    afdianSyncDisabled: false,
    paidAt: "",
    planExpiresAt: "",
  })

  const activeCount = computed(() => sponsors.value.filter((sponsor) => sponsor.isActive).length)
  const manualProfileCount = computed(() => sponsors.value.filter((sponsor) => sponsor.afdianSyncDisabled).length)

  async function loadSponsors(options: { silent?: boolean } = {}) {
    const targetLoading = options.silent ? refreshing : loading
    targetLoading.value = true
    try {
      const response = await listAdminSponsors()
      sponsors.value = response.items
      generatedAt.value = response.generatedAt
      total.value = response.total
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminSponsors.toast.loadFailedTitle"),
        error,
        t("adminSponsors.toast.actionFailedFallback")
      )
    } finally {
      targetLoading.value = false
    }
  }

  function refreshSponsors() {
    return loadSponsors({ silent: true })
  }

  function openEditDialog(sponsor: AdminSponsorProfile) {
    editingSponsor.value = sponsor
    form.value = formFromSponsor(sponsor)
    editOpen.value = true
  }

  function validateForm() {
    if (!form.value.name.trim()) {
      toast.error(t("adminSponsors.toast.validation.nameRequired"))
      return false
    }

    return true
  }

  async function saveSponsor() {
    const sponsor = editingSponsor.value
    if (!sponsor || !validateForm()) {
      return
    }

    await runAsyncAction(saving, () => updateAdminSponsorProfile(sponsor.id, createPayload(form.value)), {
      successMessage: t("adminSponsors.toast.saved"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.saveFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: async (updatedSponsor) => {
        if (updatedSponsor) {
          sponsors.value = sponsors.value.map((item) => item.id === sponsor.id ? updatedSponsor : item)
        } else {
          await loadSponsors({ silent: true })
        }
        editOpen.value = false
      },
    })
  }

  async function toggleAfdianSync(sponsor: AdminSponsorProfile, disabled: boolean) {
    await runAsyncAction(saving, () => updateAdminSponsorProfile(sponsor.id, { afdianSyncDisabled: disabled }), {
      successMessage: disabled
        ? t("adminSponsors.toast.afdianSyncDisabled")
        : t("adminSponsors.toast.afdianSyncEnabled"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.saveFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: async (updatedSponsor) => {
        if (updatedSponsor) {
          sponsors.value = sponsors.value.map((item) => item.id === sponsor.id ? updatedSponsor : item)
        } else {
          await loadSponsors({ silent: true })
        }
      },
    })
  }

  async function syncFromAfdian() {
    await runAsyncAction(syncing, syncAdminSponsorsFromAfdian, {
      successMessage: t("adminSponsors.toast.synced"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.syncFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: () => loadSponsors({ silent: true }),
    })
  }

  function formatDate(value?: string) {
    return formatLocalizedDateTime(value, undefined, t("adminSponsors.common.fallback"))
  }

  onMounted(() => {
    void loadSponsors()
  })

  return {
    loading,
    refreshing,
    saving,
    syncing,
    sponsors,
    generatedAt,
    total,
    activeCount,
    manualProfileCount,
    editOpen,
    editingSponsor,
    form,
    refreshSponsors,
    openEditDialog,
    saveSponsor,
    toggleAfdianSync,
    syncFromAfdian,
    formatDate,
  }
}
