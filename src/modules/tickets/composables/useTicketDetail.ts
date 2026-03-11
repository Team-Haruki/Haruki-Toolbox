import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
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
  let actionGeneration = 0

  const resolveTicketId = () => resolveValue(ticketId).trim()

  type LoadTicketOptions = {
    silent?: boolean
    throwOnError?: boolean
  }

  function isCurrentActionContext(expectedUserId: string | null, expectedTicketId: string) {
    return userStore.userId === expectedUserId && resolveTicketId() === expectedTicketId
  }

  function isActiveActionGeneration(generation: number) {
    return actionGeneration === generation
  }

  function invalidateActions() {
    actionGeneration += 1
    sending.value = false
    closing.value = false
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

    const generation = actionGeneration
    sending.value = true
    try {
      await addUserTicketMessage(userId, ticketIdValue, { message })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      newMessage.value = ""
      await loadTicket()
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      toast.error(t("tickets.detail.toast.sendFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.sendFailedFallback")),
      })
    } finally {
      if (!isActiveActionGeneration(generation)) return
      sending.value = false
    }
  }

  async function handleClose() {
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    if (!userId || !ticketIdValue || closing.value) return

    const generation = actionGeneration
    closing.value = true
    try {
      await closeTicket(userId, ticketIdValue)
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      try {
        await loadTicket({ silent: true, throwOnError: true })
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
        toast.success(t("tickets.detail.toast.closeSuccess"))
      } catch (error: unknown) {
        if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, t("common.postSuccessWarningDescription")),
        })
      }
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      toast.error(t("tickets.detail.toast.closeFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.closeFailedFallback")),
      })
    } finally {
      if (!isActiveActionGeneration(generation)) return
      closing.value = false
    }
  }

  function goBackToTicketList() {
    void router.push({ name: "tickets.list" })
  }

  function isMe(message: TicketMessage) {
    return message.senderId === userStore.userId
  }

  const isOpen = computed(() => ticket.value && ticket.value.status !== "closed")

  watch(
    () => resolveTicketId(),
    (nextTicketId, previousTicketId) => {
      if (nextTicketId === previousTicketId) return
      invalidateActions()
      ticket.value = null
      newMessage.value = ""
      void loadTicket()
    }
  )

  onMounted(() => {
    void loadTicket()
  })

  onBeforeUnmount(() => {
    latestLoadRequestId += 1
    invalidateActions()
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
