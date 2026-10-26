import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import {
  listToolboxSponsorUsers,
  updateToolboxSponsorAccess,
  type SponsorAccess,
  type ToolboxSponsorUser,
} from "@/modules/admin-sponsors/api/toolbox-users"

export function useToolboxSponsors() {
  const { t } = useI18n()
  const items = ref<ToolboxSponsorUser[]>([])
  const total = ref(0)
  const page = ref(1)
  const query = ref("")
  const loading = ref(false)
  const error = ref<ErrorDescription | null>(null)
  const adding = ref(false)
  const candidateQuery = ref("")
  const candidates = ref<ToolboxSponsorUser[]>([])
  const candidateTotal = ref(0)
  const candidatePage = ref(1)
  const searching = ref(false)
  const candidateError = ref("")
  const searched = ref(false)
  const editing = ref(false)
  const target = ref<ToolboxSponsorUser | null>(null)
  const access = ref<SponsorAccess>("granted")
  const note = ref("")
  let listRequest = 0
  let searchRequest = 0

  async function load(nextPage = page.value) {
    const run = ++listRequest
    loading.value = true
    error.value = null
    try {
      const data = await listToolboxSponsorUsers(query.value.trim(), nextPage)
      if (run !== listRequest) return
      items.value = data.items
      total.value = data.total
      page.value = data.page
    } catch (cause) {
      if (run === listRequest) error.value = describeError(cause, t("adminSponsors.toolbox.loadFailed"))
    } finally {
      if (run === listRequest) loading.value = false
    }
  }

  function openAdd() {
    ++searchRequest
    candidateQuery.value = ""
    candidates.value = []
    candidateTotal.value = 0
    candidatePage.value = 1
    candidateError.value = ""
    searched.value = false
    searching.value = false
    adding.value = true
  }

  async function search(nextPage = 1) {
    if (!candidateQuery.value.trim()) return
    const run = ++searchRequest
    searching.value = true
    candidateError.value = ""
    try {
      const data = await listToolboxSponsorUsers(candidateQuery.value.trim(), nextPage, "all")
      if (run !== searchRequest) return
      candidates.value = data.items
      candidateTotal.value = data.total
      candidatePage.value = data.page
      searched.value = true
    } catch (cause) {
      if (run === searchRequest) candidateError.value = describeError(cause, t("adminSponsors.toolbox.loadFailed")).message
    } finally {
      if (run === searchRequest) searching.value = false
    }
  }

  function edit(user: ToolboxSponsorUser, granting = false) {
    target.value = user
    access.value = granting ? "granted" : user.accessOverride || "automatic"
    note.value = ""
    adding.value = false
    editing.value = true
  }

  async function save() {
    const user = target.value
    if (!user) return
    if (!note.value.trim() || new TextEncoder().encode(note.value.trim()).length > 1000) {
      throw new Error(t("adminSponsors.toolbox.noteRequired"))
    }
    await updateToolboxSponsorAccess(user.userId, access.value, note.value.trim())
    toast.success(t("adminSponsors.toolbox.saved"))
    await load(1)
  }

  onMounted(() => { void load() })
  return { items, total, page, query, loading, error, adding, candidateQuery, candidates, candidateTotal, candidatePage, searching, candidateError, searched, editing, target, access, note, load, openAdd, search, edit, save }
}
