import { computed, nextTick, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { addUserTicketMessage, closeTicket, getUserTicketDetail } from "@/modules/tickets/api/user"
import type { TicketDetail, TicketMessage } from "@/types/ticket"
import { extractErrorMessage } from "@/lib/error-utils"

export function useTicketDetail(ticketId: string) {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()

  const loading = ref(true)
  const ticket = ref<TicketDetail | null>(null)
  const newMessage = ref("")
  const sending = ref(false)
  const closing = ref(false)
  const messageContainer = ref<HTMLElement | null>(null)
  let latestLoadRequestId = 0

  async function loadTicket() {
    const requestId = ++latestLoadRequestId
    const userId = userStore.userId
    if (!userId) {
      if (requestId !== latestLoadRequestId) return
      ticket.value = null
      loading.value = false
      return
    }

    loading.value = true
    try {
      const detail = await getUserTicketDetail(userId, ticketId)
      if (requestId !== latestLoadRequestId) return
      ticket.value = detail
      await nextTick()
      if (requestId !== latestLoadRequestId) return
      scrollToBottom()
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      toast.error(t("tickets.detail.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.loadFailedFallback")),
      })
    } finally {
      if (requestId !== latestLoadRequestId) return
      loading.value = false
    }
  }

  function scrollToBottom() {
    if (!messageContainer.value) return
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }

  async function sendMessage() {
    const message = newMessage.value.trim()
    const userId = userStore.userId
    if (!message || !userId || sending.value) return

    sending.value = true
    try {
      await addUserTicketMessage(userId, ticketId, { message })
      newMessage.value = ""
      await loadTicket()
    } catch (error: unknown) {
      toast.error(t("tickets.detail.toast.sendFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.sendFailedFallback")),
      })
    } finally {
      sending.value = false
    }
  }

  async function handleClose() {
    const userId = userStore.userId
    if (!userId || closing.value) return

    closing.value = true
    try {
      await closeTicket(userId, ticketId)
      toast.success(t("tickets.detail.toast.closeSuccess"))
      await loadTicket()
    } catch (error: unknown) {
      toast.error(t("tickets.detail.toast.closeFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.closeFailedFallback")),
      })
    } finally {
      closing.value = false
    }
  }

  function goBackToTicketList() {
    void router.push("/tickets")
  }

  function isMe(message: TicketMessage) {
    return message.senderId === userStore.userId
  }

  const isOpen = computed(() => ticket.value && ticket.value.status !== "closed")

  onMounted(loadTicket)

  return {
    loading,
    ticket,
    newMessage,
    sending,
    closing,
    messageContainer,
    isOpen,
    sendMessage,
    handleClose,
    isMe,
    goBackToTicketList,
  }
}
