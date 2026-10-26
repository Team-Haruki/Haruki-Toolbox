import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
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
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import {
  createPageQuery,
  setQueryValue,
  setTrimmedQueryValue,
  type QueryParams,
} from "@/core/http/query"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { readQueryDate, readQueryEnum, readQueryString, writeQueryValue } from "@/lib/query-codec"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"

interface BatchActionConfig {
  action: () => Promise<unknown>
  successMessage: (count: number) => string
  errorTitle: string
  fallbackError: string
  /** Rethrow instead of toasting: the confirm dialog reports the failure inline. */
  throwOnError?: boolean
}

type RoleFilter = "all" | UserRole
type BooleanFilter = "all" | "true" | "false"
type SortFilter =
  | "id_desc"
  | "id_asc"
  | "name_desc"
  | "name_asc"
  | "created_at_desc"
  | "created_at_asc"

const ROLE_FILTERS: readonly RoleFilter[] = ["all", "user", "admin", "super_admin"]
const BOOLEAN_FILTERS: readonly BooleanFilter[] = ["all", "true", "false"]
const SORT_FILTERS: readonly SortFilter[] = [
  "id_desc",
  "id_asc",
  "name_desc",
  "name_asc",
  "created_at_desc",
  "created_at_asc",
]
const DEFAULT_SORT: SortFilter = "id_desc"
const QUERY_KEYS = ["q", "role", "banned", "allowcn", "sort", "from", "to", "page", "size"] as const

export function useAdminUserManagement() {
  const { t } = useI18n()
  const route = useRoute()

  const initialQuery = route.query
  const search = ref(readQueryString(initialQuery.q) ?? "")
  const roleFilter = ref<RoleFilter>(readQueryEnum(initialQuery.role, ROLE_FILTERS) ?? "all")
  const bannedFilter = ref<BooleanFilter>(readQueryEnum(initialQuery.banned, BOOLEAN_FILTERS) ?? "all")
  const allowCNMysekaiFilter = ref<BooleanFilter>(readQueryEnum(initialQuery.allowcn, BOOLEAN_FILTERS) ?? "all")
  const sortFilter = ref<SortFilter>(readQueryEnum(initialQuery.sort, SORT_FILTERS) ?? DEFAULT_SORT)
  const createdFrom = ref<Date | undefined>(readQueryDate(initialQuery.from) ?? undefined)
  const createdTo = ref<Date | undefined>(readQueryDate(initialQuery.to) ?? undefined)
  // The search the list was last loaded with: an Enter-triggered load must not
  // be repeated by the debounce that follows it.
  let loadedSearch = search.value.trim()

  const selectedIds = ref<string[]>([])
  const loadError = ref<ErrorDescription | null>(null)
  const batchLoading = ref(false)
  const batchRoleTarget = ref<UserRole>("user")
  const batchAllowCNTarget = ref<"true" | "false">("true")

  const hasActiveFilters = computed(() =>
    search.value.trim() !== ""
    || roleFilter.value !== "all"
    || bannedFilter.value !== "all"
    || allowCNMysekaiFilter.value !== "all"
    || sortFilter.value !== DEFAULT_SORT
    || !!createdFrom.value
    || !!createdTo.value
  )

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
    goToPage,
  } = usePagedList<AdminUser>({
    initialPage: readAdminPage(initialQuery.page),
    initialPageSize: readAdminPageSize(initialQuery.size),
    fetchPage: ({ page, pageSize }) => getUsers(buildQueryParams(page, pageSize)),
    onBeforeLoad: () => {
      selectedIds.value = []
      loadError.value = null
    },
    onSuccess: () => {
      loadError.value = null
    },
    onError: (error) => {
      loadError.value = describeError(error, t("adminUsers.management.toast.loadFailedFallback"))
    },
  })

  function buildQueryParams(currentPage: number, currentPageSize: number) {
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    loadedSearch = search.value.trim()
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

  function reloadFromFirstPage() {
    resetPage()
    void loadUsers()
  }

  /** Enter in the search box: query now instead of waiting for the debounce. */
  function applySearch() {
    reloadFromFirstPage()
  }

  function resetFilters() {
    const selectsChanged = roleFilter.value !== "all"
      || bannedFilter.value !== "all"
      || allowCNMysekaiFilter.value !== "all"
      || sortFilter.value !== DEFAULT_SORT
      || !!createdFrom.value
      || !!createdTo.value
    search.value = ""
    roleFilter.value = "all"
    bannedFilter.value = "all"
    allowCNMysekaiFilter.value = "all"
    sortFilter.value = DEFAULT_SORT
    createdFrom.value = undefined
    createdTo.value = undefined
    // A changed select reloads through its watcher (one batched run); otherwise
    // reload now so clearing the search does not wait for the debounce.
    if (!selectsChanged) {
      reloadFromFirstPage()
    }
  }

  useDebouncedWatch(
    search,
    () => {
      if (search.value.trim() === loadedSearch) return
      reloadFromFirstPage()
    },
    400
  )

  watch([roleFilter, bannedFilter, allowCNMysekaiFilter, sortFilter, createdFrom, createdTo, pageSize], () => {
    reloadFromFirstPage()
  })

  // Keep filters + page in the URL so navigating into a user's detail and back
  // (or refreshing / sharing the link) restores the exact list state.
  useRouteQuerySync(QUERY_KEYS, () => ({
    q: writeQueryValue(search.value.trim()),
    role: writeQueryValue(roleFilter.value, "all"),
    banned: writeQueryValue(bannedFilter.value, "all"),
    allowcn: writeQueryValue(allowCNMysekaiFilter.value, "all"),
    sort: writeQueryValue(sortFilter.value, DEFAULT_SORT),
    from: writeQueryValue(createdFrom.value?.toISOString()),
    to: writeQueryValue(createdTo.value?.toISOString()),
    page: writeQueryValue(page.value, 1),
    size: writeQueryValue(pageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

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
      successAfterOnSuccess: true,
      errorTitle: config.errorTitle,
      fallbackError: config.fallbackError,
      throwOnError: config.throwOnError,
      onSuccess: async () => {
        selectedIds.value = []
        await loadUsers({ throwOnError: true, notifyOnError: false })
      },
    })
  }

  // Batch ban, force-logout and role change are confirmed in a ConfirmDialog,
  // which shows the failure inline and stays open, so they rethrow.
  async function doBatchBan() {
    await runBatchAction({
      throwOnError: true,
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
      throwOnError: true,
      action: () => batchForceLogout({ userIds: selectedIds.value }),
      successMessage: (count) => t("adminUsers.management.toast.batchForceLogoutSuccess", { count }),
      errorTitle: t("adminUsers.management.toast.batchForceLogoutFailedTitle"),
      fallbackError: t("adminUsers.management.toast.batchForceLogoutFailedFallback"),
    })
  }

  async function doBatchRole() {
    await runBatchAction({
      throwOnError: true,
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
    hasActiveFilters,
    selectedIds,
    loadError,
    batchLoading,
    batchRoleTarget,
    batchAllowCNTarget,
    totalPages,
    reloadUsers: () => {
      void loadUsers()
    },
    applySearch,
    resetFilters,
    prevPage,
    nextPage,
    goToPage,
    toggleSelect,
    toggleSelectAll,
    doBatchBan,
    doBatchUnban,
    doBatchForceLogout,
    doBatchRole,
    doBatchAllowCNMysekai,
  }
}
