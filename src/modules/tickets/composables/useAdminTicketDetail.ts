import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getUsers } from "@/modules/admin-users/api/user"
import {
  addAdminTicketMessage,
  assignTicket,
  getAdminTicketDetail,
  updateTicketStatus,
} from "@/modules/tickets/api/admin"
import type { AdminUser } from "@/types/admin"
import type { TicketDetail, TicketMessage } from "@/types/ticket"
import { ticketStatusLabel } from "@/modules/tickets/lib/display"
import { getTicketStatusOptions, isTicketStatus } from "@/modules/tickets/lib/meta"
import { extractErrorMessage } from "@/lib/error-utils"

function normalizeCreatorInfo(ticketDetail: TicketDetail) {
  if (ticketDetail.creatorUserId || !ticketDetail.messages?.length) return

  const userMessage = ticketDetail.messages.find((message) => message.senderRole === "user")
  if (!userMessage) return

  ticketDetail.creatorUserId = userMessage.senderId
  ticketDetail.creatorUserName = userMessage.senderName
}

function dedupeAdmins(admins: AdminUser[]): AdminUser[] {
  const map = new Map<string, AdminUser>()
  admins.forEach((admin) => map.set(admin.userId, admin))
  return Array.from(map.values())
}

const ADMIN_PAGE_SIZE = 200
type AdminRoleFilter = "admin" | "super_admin"
type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

export function useAdminTicketDetail(ticketId: ValueOrGetter<string>) {
  const { t } = useI18n()
  const router = useRouter()
  const loading = ref(true)
  const ticket = ref<TicketDetail | null>(null)
  const newMessage = ref("")
  const isInternal = ref(false)
  const sending = ref(false)
  const actionLoading = ref(false)
  const messageContainer = ref<HTMLElement | null>(null)
  const assigneeId = ref("")
  const adminUsers = ref<AdminUser[]>([])
  const adminUsersLoading = ref(false)
  const adminUsersLoadFailed = ref(false)
  const statusOptions = computed(() => getTicketStatusOptions(t))
  let latestLoadRequestId = 0
  let actionGeneration = 0
  const resolveTicketId = () => resolveValue(ticketId).trim()

  type LoadTicketOptions = {
    silent?: boolean
    throwOnError?: boolean
  }

  function isActiveActionGeneration(generation: number) {
    return actionGeneration === generation
  }

  function isCurrentActionContext(expectedTicketId: string) {
    return resolveTicketId() === expectedTicketId
  }

  function invalidateActions() {
    actionGeneration += 1
    sending.value = false
    actionLoading.value = false
  }

  async function loadAdminsByRole(role: AdminRoleFilter) {
    const allAdmins: AdminUser[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const response = await getUsers({ role, page, page_size: ADMIN_PAGE_SIZE })
      allAdmins.push(...(response.items ?? []))
      totalPages = Math.max(response.totalPages ?? 1, 1)

      if (!response.hasMore || page >= totalPages) {
        break
      }
      page += 1
    }

    return allAdmins
  }

  async function loadAdmins() {
    adminUsersLoading.value = true
    adminUsersLoadFailed.value = false
    try {
      const [admins, superAdmins] = await Promise.all([
        loadAdminsByRole("admin"),
        loadAdminsByRole("super_admin"),
      ])
      const allAdmins = [...admins, ...superAdmins]
      adminUsers.value = dedupeAdmins(allAdmins)
    } catch (error: unknown) {
      adminUsers.value = []
      adminUsersLoadFailed.value = true
      toast.error(t("tickets.adminDetail.toast.loadAssigneesFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.loadAssigneesFailedFallback")),
      })
    } finally {
      adminUsersLoading.value = false
    }
  }

  function scrollToBottom() {
    if (!messageContainer.value) return
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }

  async function loadTicket(options: LoadTicketOptions = {}) {
    const requestId = ++latestLoadRequestId
    const silent = options.silent ?? false
    const ticketIdValue = resolveTicketId()
    if (!ticketIdValue) {
      if (requestId !== latestLoadRequestId) return
      ticket.value = null
      loading.value = false
      return
    }

    loading.value = true
    try {
      const detail = await getAdminTicketDetail(ticketIdValue)
      if (requestId !== latestLoadRequestId) return
      normalizeCreatorInfo(detail)
      ticket.value = detail
      assigneeId.value = detail.assigneeAdminId || ""
      await nextTick()
      if (requestId !== latestLoadRequestId) return
      scrollToBottom()
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      if (!silent) {
        toast.error(t("tickets.adminDetail.toast.loadFailedTitle"), {
          description: extractErrorMessage(error, t("tickets.adminDetail.toast.loadFailedFallback")),
        })
      }
      if (options.throwOnError) {
        throw error
      }
    } finally {
      if (requestId !== latestLoadRequestId) return
      loading.value = false
    }
  }

  async function sendMessage() {
    const message = newMessage.value.trim()
    const ticketIdValue = resolveTicketId()
    if (!message || !ticketIdValue || sending.value) return

    const generation = actionGeneration
    sending.value = true
    try {
      await addAdminTicketMessage(ticketIdValue, {
        message,
        internal: isInternal.value,
      })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      newMessage.value = ""
      await loadTicket()
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      toast.error(t("tickets.adminDetail.toast.sendFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.sendFailedFallback")),
      })
    } finally {
      if (!isActiveActionGeneration(generation)) return
      sending.value = false
    }
  }

  async function handleStatusChange(newStatus: unknown) {
    if (!isTicketStatus(newStatus)) return
    if (actionLoading.value) return
    const ticketIdValue = resolveTicketId()
    if (!ticketIdValue) return

    const generation = actionGeneration
    const status = newStatus
    actionLoading.value = true
    try {
      await updateTicketStatus(ticketIdValue, { status })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      try {
        await loadTicket({ silent: true, throwOnError: true })
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
        toast.success(
          t("tickets.adminDetail.toast.statusUpdated", {
            status: ticketStatusLabel(status),
          })
        )
      } catch (error: unknown) {
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      toast.error(t("tickets.adminDetail.toast.updateStatusFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.updateStatusFailedFallback")),
      })
    } finally {
      if (!isActiveActionGeneration(generation)) return
      actionLoading.value = false
    }
  }

  async function handleAssign() {
    if (actionLoading.value) return
    const ticketIdValue = resolveTicketId()
    if (!ticketIdValue) return

    const generation = actionGeneration
    actionLoading.value = true
    try {
      const realId = assigneeId.value === "__none__" ? "" : assigneeId.value
      await assignTicket(ticketIdValue, { assigneeAdminId: realId || undefined })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      try {
        await loadTicket({ silent: true, throwOnError: true })
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
        toast.success(realId ? t("tickets.adminDetail.toast.assigned") : t("tickets.adminDetail.toast.unassigned"))
      } catch (error: unknown) {
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(ticketIdValue)) return
      toast.error(t("tickets.adminDetail.toast.assignFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.assignFailedFallback")),
      })
    } finally {
      if (!isActiveActionGeneration(generation)) return
      actionLoading.value = false
    }
  }

  function isAdmin(message: TicketMessage) {
    return message.senderRole === "admin"
  }

  function goBack() {
    void router.push({ name: "admin.tickets" })
  }

  watch(
    () => resolveTicketId(),
    (nextTicketId, previousTicketId) => {
      if (nextTicketId === previousTicketId) return
      invalidateActions()
      ticket.value = null
      newMessage.value = ""
      isInternal.value = false
      assigneeId.value = ""
      void loadTicket()
    }
  )

  onMounted(() => {
    void loadTicket()
    void loadAdmins()
  })

  onBeforeUnmount(() => {
    latestLoadRequestId += 1
    invalidateActions()
  })

  return {
    loading,
    ticket,
    newMessage,
    isInternal,
    sending,
    actionLoading,
    messageContainer,
    assigneeId,
    adminUsers,
    adminUsersLoading,
    adminUsersLoadFailed,
    statusOptions,
    sendMessage,
    handleStatusChange,
    handleAssign,
    loadAdmins,
    isAdmin,
    goBack,
  }
}
