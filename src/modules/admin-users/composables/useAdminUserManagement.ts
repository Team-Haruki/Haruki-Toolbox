import { onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
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
  const route = useRoute()
  const router = useRouter()

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
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
  const DEFAULT_PAGE_SIZE = 20

  function queryString(value: unknown): string {
    if (typeof value === "string") return value
    if (Array.isArray(value) && typeof value[0] === "string") return value[0]
    return ""
  }
  function queryEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
    const raw = queryString(value)
    return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
  }
  function queryDate(value: unknown): Date | undefined {
    const raw = queryString(value)
    if (!raw) return undefined
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  function queryInt(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(queryString(value), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  const initialQuery = route.query
  const search = ref(queryString(initialQuery.q))
  const roleFilter = ref<RoleFilter>(queryEnum(initialQuery.role, ROLE_FILTERS, "all"))
  const bannedFilter = ref<BooleanFilter>(queryEnum(initialQuery.banned, BOOLEAN_FILTERS, "all"))
  const allowCNMysekaiFilter = ref<BooleanFilter>(queryEnum(initialQuery.allowcn, BOOLEAN_FILTERS, "all"))
  const sortFilter = ref<SortFilter>(queryEnum(initialQuery.sort, SORT_FILTERS, "id_desc"))
  const createdFrom = ref<Date | undefined>(queryDate(initialQuery.from))
  const createdTo = ref<Date | undefined>(queryDate(initialQuery.to))

  const selectedIds = ref<string[]>([])
  const loadError = ref(false)
  const batchLoading = ref(false)
  const batchRoleTarget = ref<UserRole>("user")
  const batchAllowCNTarget = ref<"true" | "false">("true")

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
    initialPage: queryInt(initialQuery.page, 1),
    initialPageSize: (() => {
      const size = queryInt(initialQuery.size, DEFAULT_PAGE_SIZE)
      return PAGE_SIZE_OPTIONS.includes(size) ? size : DEFAULT_PAGE_SIZE
    })(),
    fetchPage: ({ page, pageSize }) => getUsers(buildQueryParams(page, pageSize)),
    onBeforeLoad: () => {
      selectedIds.value = []
      loadError.value = false
    },
    onSuccess: () => {
      loadError.value = false
    },
    onError: (error) => {
      loadError.value = true
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

  function buildRouteQuery(): Record<string, string> {
    const query: Record<string, string> = {}
    const trimmedSearch = search.value.trim()
    if (trimmedSearch) query.q = trimmedSearch
    if (roleFilter.value !== "all") query.role = roleFilter.value
    if (bannedFilter.value !== "all") query.banned = bannedFilter.value
    if (allowCNMysekaiFilter.value !== "all") query.allowcn = allowCNMysekaiFilter.value
    if (sortFilter.value !== "id_desc") query.sort = sortFilter.value
    if (createdFrom.value) query.from = createdFrom.value.toISOString()
    if (createdTo.value) query.to = createdTo.value.toISOString()
    if (page.value > 1) query.page = String(page.value)
    if (pageSize.value !== DEFAULT_PAGE_SIZE) query.size = String(pageSize.value)
    return query
  }

  // Keep filters + page in the URL so navigating into a user's detail and back
  // (or refreshing / sharing the link) restores the exact list state.
  watch(
    [search, roleFilter, bannedFilter, allowCNMysekaiFilter, sortFilter, createdFrom, createdTo, page, pageSize],
    () => {
      void router.replace({ query: buildRouteQuery() }).catch(() => {})
    }
  )

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
      onSuccess: async () => {
        selectedIds.value = []
        await loadUsers({ throwOnError: true, notifyOnError: false })
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
    loadError,
    batchLoading,
    batchRoleTarget,
    batchAllowCNTarget,
    totalPages,
    reloadUsers: () => {
      void loadUsers()
    },
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
