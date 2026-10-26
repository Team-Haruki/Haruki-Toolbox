import { onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { writeQueryValue } from "@/lib/query-codec"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  getGlobalGameBindings,
  type GlobalGameBinding,
} from "@/modules/admin-game-bindings/api/binding"
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
    filterSort,
    appliedFilters,
    servers,
    editServers,
    sortOptions,
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

  async function refreshBindingsStrict() {
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
    filterSort,
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
