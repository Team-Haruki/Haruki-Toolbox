import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue"
import { useRouter } from "vue-router"
import { isAxiosError } from "axios"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { addUserTicketMessage, closeTicket, getUserTicketDetail } from "@/modules/tickets/api/user"
import type { TicketDetail, TicketMessage } from "@/types/ticket"
import { describeError, extractErrorMessage, type ErrorDescription } from "@/lib/error-utils"
import { visibleUserMessages } from "@/modules/tickets/lib/messages"

type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

const SENT_STATE_MS = 2500

export function useTicketDetail(ticketId: ValueOrGetter<string>) {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()

  const loading = ref(true)
  const ticket = ref<TicketDetail | null>(null)
  /** A 404: the ticket does not exist (or is not the user's). Distinct from a load failure. */
  const notFound = ref(false)
  /** The last load failure; the view renders it with a retry button. */
  const loadError = ref<ErrorDescription | null>(null)
  const newMessage = ref("")
  const sending = ref(false)
  const closing = ref(false)
  /** Briefly true after a reply lands, for the "sent" state next to the composer. */
  const justSent = ref(false)
  let sentTimer: ReturnType<typeof setTimeout> | null = null
  // Bound to the view's `ref="messageContainer"` element.
  const messageContainer = useTemplateRef<HTMLElement>("messageContainer")
  let latestLoadRequestId = 0
  let actionGeneration = 0

  const resolveTicketId = () => resolveValue(ticketId).trim()

  const messages = computed(() => (ticket.value ? visibleUserMessages(ticket.value.messages) : []))

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

  function scrollToBottom() {
    const container = messageContainer.value
    if (!container) return
    container.scrollTop = container.scrollHeight
  }

  async function scrollToBottomWhenRendered() {
    // The container only exists once `loading` is false and the ticket is
    // rendered; wait for that paint before touching scrollTop.
    await nextTick()
    scrollToBottom()
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(scrollToBottom)
    }
  }

  async function loadTicket(): Promise<boolean> {
    const requestId = ++latestLoadRequestId
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    if (!userId || !ticketIdValue) {
      if (requestId !== latestLoadRequestId) return false
      ticket.value = null
      loading.value = false
      return false
    }

    loading.value = true
    loadError.value = null
    notFound.value = false
    try {
      const detail = await getUserTicketDetail(userId, ticketIdValue)
      if (requestId !== latestLoadRequestId) return false
      ticket.value = detail
      loading.value = false
      await scrollToBottomWhenRendered()
      return true
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return false
      ticket.value = null
      loading.value = false
      if (isAxiosError(error) && error.response?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = describeError(error, t("tickets.detail.toast.loadFailedFallback"))
      }
      return false
    }
  }

  function markSent() {
    justSent.value = true
    if (sentTimer) clearTimeout(sentTimer)
    sentTimer = setTimeout(() => {
      justSent.value = false
      sentTimer = null
    }, SENT_STATE_MS)
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
      markSent()
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

  /**
   * Closes the ticket. Rejects on failure (the confirm dialog shows the error
   * and stays open); a failed reload afterwards is only a warning.
   */
  async function handleClose() {
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    if (!userId || !ticketIdValue || closing.value) return

    const generation = actionGeneration
    closing.value = true
    try {
      await closeTicket(userId, ticketIdValue)
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      const reloaded = await loadTicket()
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      if (reloaded) {
        toast.success(t("tickets.detail.toast.closeSuccess"))
      } else {
        toast.warning(t("common.postSuccessWarningTitle"), {
          description: loadError.value?.message ?? t("common.postSuccessWarningDescription"),
        })
      }
    } finally {
      if (isActiveActionGeneration(generation)) {
        closing.value = false
      }
    }
  }

  function goBackToTicketList() {
    void router.push({ name: "tickets.list" })
  }

  function isMe(message: TicketMessage) {
    if (message.senderRole === "system") return false
    // The user-facing detail API omits senderId, so fall back to the sender
    // role: on a user's own ticket, "user" messages are always theirs.
    if (message.senderId) {
      return message.senderId === userStore.userId
    }
    return message.senderRole === "user"
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
    if (sentTimer) clearTimeout(sentTimer)
  })

  return {
    loading,
    loadError,
    notFound,
    ticket,
    messages,
    newMessage,
    sending,
    closing,
    justSent,
    isOpen,
    loadTicket,
    sendMessage,
    handleClose,
    isMe,
    goBackToTicketList,
  }
}
