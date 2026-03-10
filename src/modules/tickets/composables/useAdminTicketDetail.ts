import { computed, nextTick, onMounted, ref } from "vue"
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

export function useAdminTicketDetail(ticketId: string) {
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
  const statusOptions = computed(() => getTicketStatusOptions(t))
  let latestLoadRequestId = 0
  type LoadTicketOptions = {
    silent?: boolean
    throwOnError?: boolean
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
    try {
      const [admins, superAdmins] = await Promise.all([
        loadAdminsByRole("admin"),
        loadAdminsByRole("super_admin"),
      ])
      const allAdmins = [...admins, ...superAdmins]
      adminUsers.value = dedupeAdmins(allAdmins)
    } catch {
      // Keep empty option list when fetch fails.
      adminUsers.value = []
    }
  }

  function scrollToBottom() {
    if (!messageContainer.value) return
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }

  async function loadTicket(options: LoadTicketOptions = {}) {
    const requestId = ++latestLoadRequestId
    const silent = options.silent ?? false
    loading.value = true
    try {
      const detail = await getAdminTicketDetail(ticketId)
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
    if (!message || sending.value) return

    sending.value = true
    try {
      await addAdminTicketMessage(ticketId, {
        message,
        internal: isInternal.value,
      })
      newMessage.value = ""
      await loadTicket()
    } catch (error: unknown) {
      toast.error(t("tickets.adminDetail.toast.sendFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.sendFailedFallback")),
      })
    } finally {
      sending.value = false
    }
  }

  async function handleStatusChange(newStatus: unknown) {
    if (!isTicketStatus(newStatus)) return
    const status = newStatus
    actionLoading.value = true
    try {
      await updateTicketStatus(ticketId, { status })
      try {
        await loadTicket({ silent: true, throwOnError: true })
        toast.success(
          t("tickets.adminDetail.toast.statusUpdated", {
            status: ticketStatusLabel(status),
          })
        )
      } catch (error: unknown) {
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      toast.error(t("tickets.adminDetail.toast.updateStatusFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.updateStatusFailedFallback")),
      })
    } finally {
      actionLoading.value = false
    }
  }

  async function handleAssign() {
    actionLoading.value = true
    try {
      const realId = assigneeId.value === "__none__" ? "" : assigneeId.value
      await assignTicket(ticketId, { assigneeAdminId: realId || undefined })
      try {
        await loadTicket({ silent: true, throwOnError: true })
        toast.success(realId ? t("tickets.adminDetail.toast.assigned") : t("tickets.adminDetail.toast.unassigned"))
      } catch (error: unknown) {
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      toast.error(t("tickets.adminDetail.toast.assignFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.adminDetail.toast.assignFailedFallback")),
      })
    } finally {
      actionLoading.value = false
    }
  }

  function isAdmin(message: TicketMessage) {
    return message.senderRole === "admin"
  }

  function goBack() {
    void router.push("/admin/tickets")
  }

  onMounted(() => {
    void loadTicket()
    void loadAdmins()
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
    statusOptions,
    sendMessage,
    handleStatusChange,
    handleAssign,
    isAdmin,
    goBack,
  }
}
