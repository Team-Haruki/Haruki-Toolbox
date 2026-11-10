import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { writeQueryValue } from "@/lib/query-codec"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  getGameBindingStats,
  getGlobalGameBindings,
  type GlobalGameBinding,
} from "@/modules/admin-game-bindings/api/binding"
import { type GameBindingStats, summarizePageSharing } from "@/modules/admin-game-bindings/lib/binding-stats"
import {
  parseBindingKey,
  resolveServerLabel,
  toBindingKey,
} from "@/modules/admin-game-bindings/lib/management-meta"
import {
  GAME_BINDING_FILTER_QUERY_KEYS,
  useGameBindingFilters,
  writeGameBindingFiltersQuery,
} from "@/modules/admin-game-bindings/composables/useGameBindingFilters"
import { useGameBindingSelection } from "@/modules/admin-game-bindings/composables/useGameBindingSelection"
import { useGameBindingEditor } from "@/modules/admin-game-bindings/composables/useGameBindingEditor"
import { useGameBindingActions } from "@/modules/admin-game-bindings/composables/useGameBindingActions"

const QUERY_KEYS = [...GAME_BINDING_FILTER_QUERY_KEYS, "page", "size"] as const

export function useGameBindingManagement() {
  const { t } = useI18n()
  const route = useRoute()
  const {
    filterQ,
    filterServer,
    filterUserId,
    filterGameUserId,
    filterVerified,
    filterSort,
    appliedFilters,
    servers,
    editServers,
    sortOptions,
    verifiedOptions,
    applyFilterValues,
    buildQueryParams,
    resetFilterValues,
  } = useGameBindingFilters()

  const {
    editDialogOpen,
    editTargetUserId,
    editServer,
    editGameUserId,
    editOriginalServer,
    editOriginalGameUserId,
    editSuite,
    editMysekai,
    isEditMode,
    openAddBinding,
    openEditBinding,
  } = useGameBindingEditor()

  const loadError = ref<ErrorDescription | null>(null)

  const {
    loading,
    items: bindings,
    total,
    page,
    pageSize,
    totalPages,
    resetPage,
    load: loadBindings,
    prevPage,
    nextPage,
    goToPage,
  } = usePagedList<GlobalGameBinding>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: ({ page, pageSize }) => getGlobalGameBindings(buildQueryParams(page, pageSize)),
    onBeforeLoad: () => {
      resetSelection()
      loadError.value = null
    },
    onError: (error) => {
      loadError.value = describeError(error, t("adminGameBindings.toast.loadFailedFallback"))
    },
  })

  // Site-wide counts from the dashboard statistics. They load beside the
  // list and never hold it back; null with `statsFailed` when they could not
  // be read.
  const stats = ref<GameBindingStats | null>(null)
  const statsLoading = ref(true)
  const statsFailed = ref(false)
  let statsRequestId = 0

  async function loadStats() {
    const requestId = ++statsRequestId
    statsLoading.value = true
    try {
      const loaded = await getGameBindingStats()
      if (requestId !== statsRequestId) return
      stats.value = loaded
      statsFailed.value = loaded === null
    } catch {
      if (requestId !== statsRequestId) return
      stats.value = null
      statsFailed.value = true
    } finally {
      if (requestId === statsRequestId) statsLoading.value = false
    }
  }

  // Sharing switches of the rows on screen only; the page labels them as such.
  const pageSharing = computed(() => summarizePageSharing(bindings.value))

  /** After a change that adds, moves or removes a binding: the list, then the counts. */
  async function refreshBindingsStrict() {
    void loadStats()
    await loadBindings({ throwOnError: true, notifyOnError: false })
  }

  function bindingKey(binding: GlobalGameBinding) {
    return toBindingKey(binding)
  }

  function serverLabel(server: string) {
    return resolveServerLabel(server, t)
  }

  const {
    selected,
    selectAll,
    resetSelection,
    toggleSelect,
    toggleSelectAll,
    parseSelectedBindings,
  } = useGameBindingSelection(bindings, bindingKey, parseBindingKey)

  const {
    reassignDialogOpen,
    reassignTarget,
    reassignTargetUserId,
    actionLoading,
    deleteDialogOpen,
    deleteTarget,
    openDeleteConfirm,
    handleDelete,
    openReassign,
    handleReassign,
    handleBatchDelete,
    handleSaveBinding,
  } = useGameBindingActions({
    loadBindings: refreshBindingsStrict,
    selected,
    parseSelectedBindings,
    editDialogOpen,
    editTargetUserId,
    editServer,
    editGameUserId,
    editOriginalServer,
    editOriginalGameUserId,
    editSuite,
    editMysekai,
    isEditMode,
  })

  function applyFilters() {
    applyFilterValues()
    resetPage()
    void loadBindings()
  }

  function resetFilters() {
    resetFilterValues()
    applyFilters()
  }

  function reload() {
    void loadBindings()
  }

  watch(pageSize, () => {
    resetPage()
    void loadBindings()
  })

  useRouteQuerySync(QUERY_KEYS, () => ({
    ...writeGameBindingFiltersQuery(appliedFilters.value),
    page: writeQueryValue(page.value, 1),
    size: writeQueryValue(pageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

  onMounted(() => {
    void loadBindings()
    void loadStats()
  })

  return {
    loading,
    loadError,
    bindings,
    total,
    page,
    pageSize,
    totalPages,
    filterQ,
    filterServer,
    filterUserId,
    filterGameUserId,
    filterVerified,
    filterSort,
    stats,
    statsLoading,
    statsFailed,
    loadStats,
    pageSharing,
    selected,
    selectAll,
    reassignDialogOpen,
    reassignTarget,
    reassignTargetUserId,
    actionLoading,
    deleteDialogOpen,
    deleteTarget,
    editDialogOpen,
    editTargetUserId,
    editServer,
    editGameUserId,
    editSuite,
    editMysekai,
    isEditMode,
    servers,
    sortOptions,
    verifiedOptions,
    editServers,
    bindingKey,
    serverLabel,
    applyFilters,
    resetFilters,
    reload,
    prevPage,
    nextPage,
    goToPage,
    toggleSelect,
    toggleSelectAll,
    openDeleteConfirm,
    handleDelete,
    openReassign,
    handleReassign,
    handleBatchDelete,
    openAddBinding,
    openEditBinding,
    handleSaveBinding,
  }
}
