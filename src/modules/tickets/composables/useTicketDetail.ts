import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { addUserTicketMessage, closeTicket, getUserTicketDetail } from "@/modules/tickets/api/user"
import type { TicketDetail, TicketMessage } from "@/types/ticket"
import { extractErrorMessage } from "@/lib/error-utils"

type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

export function useTicketDetail(ticketId: ValueOrGetter<string>) {
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

  const resolveTicketId = () => resolveValue(ticketId).trim()

  type LoadTicketOptions = {
    silent?: boolean
    throwOnError?: boolean
  }

  async function loadTicket(options: LoadTicketOptions = {}) {
    const requestId = ++latestLoadRequestId
    const silent = options.silent ?? false
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    if (!userId || !ticketIdValue) {
      if (requestId !== latestLoadRequestId) return
      ticket.value = null
      loading.value = false
      return
    }

    loading.value = true
    try {
      const detail = await getUserTicketDetail(userId, ticketIdValue)
      if (requestId !== latestLoadRequestId) return
      ticket.value = detail
      await nextTick()
      if (requestId !== latestLoadRequestId) return
      scrollToBottom()
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      if (!silent) {
        toast.error(t("tickets.detail.toast.loadFailedTitle"), {
          description: extractErrorMessage(error, t("tickets.detail.toast.loadFailedFallback")),
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

  function scrollToBottom() {
    if (!messageContainer.value) return
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }

  async function sendMessage() {
    const message = newMessage.value.trim()
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    if (!message || !userId || !ticketIdValue || sending.value) return

    sending.value = true
    try {
      await addUserTicketMessage(userId, ticketIdValue, { message })
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
    const ticketIdValue = resolveTicketId()
    if (!userId || !ticketIdValue || closing.value) return

    closing.value = true
    try {
      await closeTicket(userId, ticketIdValue)
      try {
        await loadTicket({ silent: true, throwOnError: true })
        toast.success(t("tickets.detail.toast.closeSuccess"))
      } catch (error: unknown) {
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
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

  watch(
    () => resolveTicketId(),
    (nextTicketId, previousTicketId) => {
      if (nextTicketId === previousTicketId) return
      ticket.value = null
      newMessage.value = ""
      void loadTicket()
    }
  )

  onMounted(() => {
    void loadTicket()
  })

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
