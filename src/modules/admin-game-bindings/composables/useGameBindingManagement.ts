import { onMounted } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { usePagedList } from "@/composables/usePagedList"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  getGlobalGameBindings,
  type GlobalGameBinding,
} from "@/modules/admin-game-bindings/api/binding"
import {
  parseBindingKey,
  resolveServerLabel,
  toBindingKey,
} from "@/modules/admin-game-bindings/lib/management-meta"
import { useGameBindingFilters } from "@/modules/admin-game-bindings/composables/useGameBindingFilters"
import { useGameBindingSelection } from "@/modules/admin-game-bindings/composables/useGameBindingSelection"
import { useGameBindingEditor } from "@/modules/admin-game-bindings/composables/useGameBindingEditor"
import { useGameBindingActions } from "@/modules/admin-game-bindings/composables/useGameBindingActions"

export function useGameBindingManagement() {
  const { t } = useI18n()
  const {
    filterQ,
    filterServer,
    filterUserId,
    filterGameUserId,
    filterSort,
    servers,
    editServers,
    sortOptions,
    buildQueryParams,
    resetFilterValues,
  } = useGameBindingFilters()

  const {
    editDialogOpen,
    editTargetUserId,
    editServer,
    editGameUserId,
    editSuite,
    editMysekai,
    isEditMode,
    openAddBinding,
    openEditBinding,
  } = useGameBindingEditor()

  const {
    loading,
    items: bindings,
    total,
    page,
    totalPages,
    resetPage,
    load: loadBindings,
    prevPage,
    nextPage,
  } = usePagedList<GlobalGameBinding>({
    initialPage: 1,
    initialPageSize: 50,
    fetchPage: ({ page, pageSize }) => getGlobalGameBindings(buildQueryParams(page, pageSize)),
    onBeforeLoad: () => {
      resetSelection()
    },
    onError: (error) => {
      toast.error(t("adminGameBindings.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("adminGameBindings.toast.loadFailedFallback")),
      })
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
    editSuite,
    editMysekai,
    isEditMode,
  })

  function applyFilters() {
    resetPage()
    void loadBindings()
  }

  function resetFilters() {
    resetFilterValues()
    resetPage()
    void loadBindings()
  }

  onMounted(() => {
    void loadBindings()
  })

  return {
    loading,
    bindings,
    total,
    page,
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
    prevPage,
    nextPage,
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
