import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import {
  addAdminSponsorManualDuration,
  createAdminSponsor,
  deleteAdminSponsorManualDuration,
  getAdminSponsorDetail,
  listAdminSponsors,
  syncAdminSponsorsFromAfdian,
  updateAdminSponsorManualDuration,
  updateAdminSponsorProfile,
} from "@/modules/admin-sponsors/api/sponsors"
import {
  emptyManualDurationForm,
  fromDateTimeLocalValue,
  manualDurationFormFromEntry,
  manualDurationPayload,
  toDateTimeLocalValue,
  type ManualDurationForm,
} from "@/modules/admin-sponsors/lib/manual-duration"
import type {
  AdminManualDuration,
  AdminSponsorDetail,
  AdminSponsorProfile,
  AdminSponsorUpdatePayload,
} from "@/types/admin"

type SponsorForm = {
  name: string
  avatar: string
  planName: string
  message: string
  source: string
  afdianSyncDisabled: boolean
  paidAt: string
}

type CreateSponsorForm = {
  name: string
  avatar: string
  planName: string
  message: string
}

function formFromSponsor(sponsor: AdminSponsorProfile): SponsorForm {
  return {
    name: sponsor.name,
    avatar: sponsor.avatar,
    planName: sponsor.planName,
    message: sponsor.message,
    source: sponsor.source,
    afdianSyncDisabled: sponsor.afdianSyncDisabled,
    paidAt: toDateTimeLocalValue(sponsor.paidAt),
  }
}

function createPayload(form: SponsorForm): AdminSponsorUpdatePayload {
  return {
    name: form.name.trim(),
    avatar: form.avatar.trim(),
    planName: form.planName.trim(),
    message: form.message.trim(),
    source: form.source.trim(),
    afdianSyncDisabled: form.afdianSyncDisabled,
    paidAt: fromDateTimeLocalValue(form.paidAt),
  }
}

function emptyCreateForm(): CreateSponsorForm {
  return { name: "", avatar: "", planName: "", message: "" }
}

export function useAdminSponsorManagement() {
  const { t } = useI18n()

  const loading = ref(true)
  const refreshing = ref(false)
  const saving = ref(false)
  const syncing = ref(false)
  const togglingIds = ref<Set<string>>(new Set())
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
    afdianSyncDisabled: false,
    paidAt: "",
  })

  const detail = ref<AdminSponsorDetail | null>(null)
  const detailLoading = ref(false)
  const manualFormOpen = ref(false)
  const editingEntryId = ref<number | null>(null)
  const manualForm = ref<ManualDurationForm>(emptyManualDurationForm())
  const manualSaving = ref(false)
  const deletingEntry = ref(false)

  const createOpen = ref(false)
  const creating = ref(false)
  const createForm = ref<CreateSponsorForm>(emptyCreateForm())

  const activeCount = computed(() => sponsors.value.filter((sponsor) => sponsor.category === "current").length)
  const manualProfileCount = computed(() => sponsors.value.filter((sponsor) => sponsor.afdianSyncDisabled).length)

  function replaceSponsor(updated: AdminSponsorProfile) {
    const exists = sponsors.value.some((item) => item.id === updated.id)
    if (exists) {
      sponsors.value = sponsors.value.map((item) => item.id === updated.id ? updated : item)
    } else {
      sponsors.value = [updated, ...sponsors.value]
      total.value += 1
    }
    if (editingSponsor.value?.id === updated.id) {
      editingSponsor.value = updated
    }
  }

  function applyDetail(next: AdminSponsorDetail) {
    detail.value = next
    replaceSponsor(next.sponsor)
  }

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

  async function loadDetail(sponsorId: string) {
    detailLoading.value = true
    try {
      const next = await getAdminSponsorDetail(sponsorId)
      if (editingSponsor.value?.id === sponsorId) {
        applyDetail(next)
      }
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminSponsors.toast.loadFailedTitle"),
        error,
        t("adminSponsors.toast.actionFailedFallback")
      )
    } finally {
      detailLoading.value = false
    }
  }

  function closeManualForm() {
    manualFormOpen.value = false
    editingEntryId.value = null
    manualForm.value = emptyManualDurationForm()
  }

  function openEditDialog(sponsor: AdminSponsorProfile) {
    editingSponsor.value = sponsor
    form.value = formFromSponsor(sponsor)
    detail.value = null
    closeManualForm()
    editOpen.value = true
    void loadDetail(sponsor.id)
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
          replaceSponsor(updatedSponsor)
        } else {
          await loadSponsors({ silent: true })
        }
        editOpen.value = false
      },
    })
  }

  function startNewManualEntry() {
    editingEntryId.value = null
    manualForm.value = emptyManualDurationForm()
    manualFormOpen.value = true
  }

  function startEditManualEntry(entry: AdminManualDuration) {
    editingEntryId.value = entry.id
    manualForm.value = manualDurationFormFromEntry(entry)
    manualFormOpen.value = true
  }

  async function saveManualEntry() {
    const sponsor = editingSponsor.value
    if (!sponsor) {
      return
    }
    const result = manualDurationPayload(manualForm.value)
    if (!result.ok) {
      toast.error(t(`adminSponsors.duration.validation.${result.error}`))
      return
    }
    const entryId = editingEntryId.value
    await runAsyncAction(
      manualSaving,
      () => entryId === null
        ? addAdminSponsorManualDuration(sponsor.id, result.payload)
        : updateAdminSponsorManualDuration(sponsor.id, entryId, result.payload),
      {
        successMessage: t("adminSponsors.toast.manualSaved"),
        successAfterOnSuccess: true,
        errorTitle: t("adminSponsors.toast.manualSaveFailedTitle"),
        fallbackError: t("adminSponsors.toast.actionFailedFallback"),
        onSuccess: (next) => {
          // The editor may have moved on to another sponsor meanwhile.
          if (editingSponsor.value?.id !== sponsor.id) {
            replaceSponsor(next.sponsor)
            return
          }
          applyDetail(next)
          closeManualForm()
        },
      },
    )
  }

  async function deleteManualEntry(entry: AdminManualDuration) {
    const sponsor = editingSponsor.value
    if (!sponsor) {
      return
    }
    await runAsyncAction(deletingEntry, () => deleteAdminSponsorManualDuration(sponsor.id, entry.id), {
      successMessage: t("adminSponsors.toast.manualDeleted"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.manualDeleteFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: (next) => {
        if (editingSponsor.value?.id !== sponsor.id) {
          replaceSponsor(next.sponsor)
          return
        }
        applyDetail(next)
        if (editingEntryId.value === entry.id) {
          closeManualForm()
        }
      },
    })
  }

  function openCreateDialog() {
    createForm.value = emptyCreateForm()
    createOpen.value = true
  }

  async function createSponsor() {
    if (!createForm.value.name.trim()) {
      toast.error(t("adminSponsors.toast.validation.nameRequired"))
      return
    }
    await runAsyncAction(creating, () => createAdminSponsor({
      name: createForm.value.name.trim(),
      avatar: createForm.value.avatar.trim(),
      planName: createForm.value.planName.trim(),
      message: createForm.value.message.trim(),
    }), {
      successMessage: t("adminSponsors.toast.created"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.saveFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: (next) => {
        replaceSponsor(next.sponsor)
        createOpen.value = false
        // Go straight to the editor so time can be added.
        openEditDialog(next.sponsor)
      },
    })
  }

  function isToggling(sponsorId: string) {
    return togglingIds.value.has(sponsorId)
  }

  async function toggleAfdianSync(sponsor: AdminSponsorProfile, disabled: boolean) {
    if (togglingIds.value.has(sponsor.id)) {
      return
    }

    const rowLoading = {
      get value() {
        return togglingIds.value.has(sponsor.id)
      },
      set value(next: boolean) {
        const nextSet = new Set(togglingIds.value)
        if (next) {
          nextSet.add(sponsor.id)
        } else {
          nextSet.delete(sponsor.id)
        }
        togglingIds.value = nextSet
      },
    }

    await runAsyncAction(rowLoading, () => updateAdminSponsorProfile(sponsor.id, { afdianSyncDisabled: disabled }), {
      successMessage: disabled
        ? t("adminSponsors.toast.afdianSyncDisabled")
        : t("adminSponsors.toast.afdianSyncEnabled"),
      successAfterOnSuccess: true,
      errorTitle: t("adminSponsors.toast.saveFailedTitle"),
      fallbackError: t("adminSponsors.toast.actionFailedFallback"),
      onSuccess: async (updatedSponsor) => {
        if (updatedSponsor) {
          replaceSponsor(updatedSponsor)
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
    detail,
    detailLoading,
    manualFormOpen,
    editingEntryId,
    manualForm,
    manualSaving,
    deletingEntry,
    createOpen,
    creating,
    createForm,
    refreshSponsors,
    openEditDialog,
    saveSponsor,
    startNewManualEntry,
    startEditManualEntry,
    closeManualForm,
    saveManualEntry,
    deleteManualEntry,
    openCreateDialog,
    createSponsor,
    isToggling,
    toggleAfdianSync,
    syncFromAfdian,
    formatDate,
  }
}
