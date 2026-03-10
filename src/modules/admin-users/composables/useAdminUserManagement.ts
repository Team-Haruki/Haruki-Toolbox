import { onMounted, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import {
  batchAllowCNMysekai,
  batchBan,
  batchForceLogout,
  batchRole,
  batchUnban,
  getUsers,
} from "@/modules/admin-users/api/user"
import type { AdminUser } from "@/types/admin"
import type { UserRole } from "@/types/common"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import {
  createPageQuery,
  setQueryValue,
  setTrimmedQueryValue,
  type QueryParams,
} from "@/core/http/query"
import { extractErrorMessage } from "@/lib/error-utils"

interface BatchActionConfig {
  action: () => Promise<unknown>
  successMessage: (count: number) => string
  errorTitle: string
  fallbackError: string
}

export function useAdminUserManagement() {
  type RoleFilter = "all" | UserRole
  type BooleanFilter = "all" | "true" | "false"
  type SortFilter =
    | "id_desc"
    | "id_asc"
    | "name_desc"
    | "name_asc"
    | "created_at_desc"
    | "created_at_asc"

  const { t } = useI18n()

  const search = ref("")
  const roleFilter = ref<RoleFilter>("all")
  const bannedFilter = ref<BooleanFilter>("all")
  const allowCNMysekaiFilter = ref<BooleanFilter>("all")
  const sortFilter = ref<SortFilter>("id_desc")
  const createdFrom = ref<Date>()
  const createdTo = ref<Date>()

  const selectedIds = ref<string[]>([])
  const batchLoading = ref(false)
  const batchRoleTarget = ref<UserRole>("user")
  const batchAllowCNTarget = ref("true")

  const {
    loading,
    items: users,
    page,
    pageSize,
    total,
    totalPages: totalPagesRef,
    resetPage,
    load: loadUsers,
    prevPage,
    nextPage,
  } = usePagedList<AdminUser>({
    initialPage: 1,
    initialPageSize: 20,
    fetchPage: ({ page, pageSize }) => getUsers(buildQueryParams(page, pageSize)),
    onBeforeLoad: () => {
      selectedIds.value = []
    },
    onError: (error) => {
      toast.error(t("adminUsers.management.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("adminUsers.management.toast.loadFailedFallback")),
      })
    },
  })

  function buildQueryParams(currentPage: number, currentPageSize: number) {
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    setQueryValue(params, "sort", sortFilter.value)
    setTrimmedQueryValue(params, "q", search.value)

    if (roleFilter.value !== "all") setQueryValue(params, "role", roleFilter.value)
    if (bannedFilter.value !== "all") setQueryValue(params, "banned", bannedFilter.value)
    if (allowCNMysekaiFilter.value !== "all") {
      setQueryValue(params, "allow_cn_mysekai", allowCNMysekaiFilter.value)
    }

    setQueryValue(params, "created_from", createdFrom.value?.toISOString())
    setQueryValue(params, "created_to", createdTo.value?.toISOString())
    return params
  }

  useDebouncedWatch(
    search,
    () => {
      resetPage()
      void loadUsers()
    },
    400
  )

  watch([roleFilter, bannedFilter, allowCNMysekaiFilter, sortFilter, createdFrom, createdTo, pageSize], () => {
    resetPage()
    void loadUsers()
  })

  onMounted(() => {
    void loadUsers()
  })

  function totalPages() {
    return totalPagesRef.value
  }

  function toggleSelect(userId: string) {
    if (selectedIds.value.includes(userId)) {
      selectedIds.value = selectedIds.value.filter((id) => id !== userId)
      return
    }
    selectedIds.value.push(userId)
  }

  function toggleSelectAll() {
    if (users.value.length > 0 && selectedIds.value.length === users.value.length) {
      selectedIds.value = []
      return
    }
    selectedIds.value = users.value.map((item) => item.userId)
  }

  async function runBatchAction(config: BatchActionConfig) {
    if (selectedIds.value.length === 0) return
    const selectedCount = selectedIds.value.length
    await runAsyncAction(batchLoading, config.action, {
      successMessage: config.successMessage(selectedCount),
      errorTitle: config.errorTitle,
      fallbackError: config.fallbackError,
      onSuccess: async () => {
        selectedIds.value = []
        await loadUsers()
      },
    })
  }

  async function doBatchBan() {
    await runBatchAction({
      action: () => batchBan({ userIds: selectedIds.value }),
      successMessage: (count) => t("adminUsers.management.toast.batchBanSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchBanFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchBanFailedFallback"),
    })
  }

  async function doBatchUnban() {
    await runBatchAction({
      action: () => batchUnban({ userIds: selectedIds.value }),
      successMessage: (count) => t("adminUsers.management.toast.batchUnbanSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchUnbanFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchUnbanFailedFallback"),
    })
  }

  async function doBatchForceLogout() {
    await runBatchAction({
      action: () => batchForceLogout({ userIds: selectedIds.value }),
      successMessage: (count) => t("adminUsers.management.toast.batchForceLogoutSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchForceLogoutFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchForceLogoutFailedFallback"),
    })
  }

  async function doBatchRole() {
    await runBatchAction({
      action: () => batchRole({ userIds: selectedIds.value, role: batchRoleTarget.value }),
      successMessage: (count) => t("adminUsers.management.toast.batchRoleSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchRoleFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchRoleFailedFallback"),
    })
  }

  async function doBatchAllowCNMysekai() {
    await runBatchAction({
      action: () =>
        batchAllowCNMysekai({
          userIds: selectedIds.value,
          allowCNMysekai: batchAllowCNTarget.value === "true",
        }),
      successMessage: (count) => t("adminUsers.management.toast.batchAllowCNSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchAllowCNFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchAllowCNFailedFallback"),
    })
  }

  return {
    loading,
    users,
    total,
    page,
    pageSize,
    search,
    roleFilter,
    bannedFilter,
    allowCNMysekaiFilter,
    sortFilter,
    createdFrom,
    createdTo,
    selectedIds,
    batchLoading,
    batchRoleTarget,
    batchAllowCNTarget,
    totalPages,
    prevPage,
    nextPage,
    toggleSelect,
    toggleSelectAll,
    doBatchBan,
    doBatchUnban,
    doBatchForceLogout,
    doBatchRole,
    doBatchAllowCNMysekai,
  }
}
