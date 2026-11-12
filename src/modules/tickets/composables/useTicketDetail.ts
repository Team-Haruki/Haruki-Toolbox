import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue"
import { isAxiosError } from "axios"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { addUserTicketMessage, closeTicket, getUserTicketDetail } from "@/modules/tickets/api/user"
import type { TicketDetail, TicketMessage } from "@/types/ticket"
import { describeError, extractErrorMessage, type ErrorDescription } from "@/lib/error-utils"
import { visibleUserMessages } from "@/modules/tickets/lib/messages"
import { countCharacters, TICKET_MESSAGE_MAX_LENGTH } from "@/modules/tickets/lib/ticket-draft"
import { canCloseTicket, canReplyToTicket } from "@/modules/tickets/lib/user-ticket"
import { isOwnMessage } from "@/modules/tickets/lib/user-ticket-thread"

type ValueOrGetter<T> = T | (() => T)

function resolveValue<T>(value: ValueOrGetter<T>): T {
  return typeof value === "function" ? (value as () => T)() : value
}

const SENT_STATE_MS = 2500

type LoadTicketOptions = {
  /**
   * Refresh the ticket already on screen: no skeleton, and a failure leaves
   * what is shown in place (only a 404 replaces it).
   */
  silent?: boolean
}

export function useTicketDetail(ticketId: ValueOrGetter<string>) {
  const { t } = useI18n()
  const userStore = useUserStore()

  const loading = ref(true)
  /** A refresh of the ticket on screen is in flight. */
  const refreshing = ref(false)
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
  // Bound to the view's `ref="threadEnd"` element, the end of the conversation.
  const threadEnd = useTemplateRef<HTMLElement>("threadEnd")
  let latestLoadRequestId = 0
  let actionGeneration = 0

  const resolveTicketId = () => resolveValue(ticketId).trim()

  const messages = computed(() => (ticket.value ? visibleUserMessages(ticket.value.messages) : []))
  const replyLength = computed(() => countCharacters(newMessage.value.trim()))
  const replyTooLong = computed(() => replyLength.value > TICKET_MESSAGE_MAX_LENGTH)
  const canSend = computed(() => replyLength.value > 0 && !replyTooLong.value && !sending.value)

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

  /** Brings the end of the conversation into view after the user's own reply landed. */
  async function revealThreadEnd() {
    await nextTick()
    const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    threadEnd.value?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" })
  }

  async function loadTicket(options: LoadTicketOptions = {}): Promise<boolean> {
    const requestId = ++latestLoadRequestId
    const userId = userStore.userId
    const ticketIdValue = resolveTicketId()
    const silent = options.silent === true && ticket.value !== null
    if (!userId || !ticketIdValue) {
      if (requestId !== latestLoadRequestId) return false
      ticket.value = null
      loading.value = false
      refreshing.value = false
      return false
    }

    if (silent) {
      refreshing.value = true
    } else {
      loading.value = true
      loadError.value = null
      notFound.value = false
    }
    try {
      const detail = await getUserTicketDetail(userId, ticketIdValue)
      if (requestId !== latestLoadRequestId) return false
      ticket.value = detail
      loadError.value = null
      notFound.value = false
      return true
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return false
      const missing = isAxiosError(error) && error.response?.status === 404
      if (missing) {
        ticket.value = null
        notFound.value = true
      } else if (!silent) {
        ticket.value = null
        loadError.value = describeError(error, t("tickets.detail.toast.loadFailedFallback"))
      }
      return false
    } finally {
      if (requestId === latestLoadRequestId) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  /** The refresh button, and the tab coming back into view: has anyone replied? */
  function refresh() {
    if (!ticket.value || refreshing.value || sending.value || closing.value) return
    void loadTicket({ silent: true })
  }

  function refreshWhenVisible() {
    if (document.visibilityState === "visible") refresh()
  }

  function warnRefreshFailed() {
    toast.warning(t("common.postSuccessWarningTitle"), {
      description: t("common.postSuccessWarningDescription"),
    })
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
    if (!message || !userId || !ticketIdValue || !canSend.value) return

    const generation = actionGeneration
    sending.value = true
    try {
      await addUserTicketMessage(userId, ticketIdValue, { message })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      newMessage.value = ""
      markSent()
      // The thread stays on screen while it is read again with the new reply.
      const reloaded = await loadTicket({ silent: true })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      if (reloaded) {
        await revealThreadEnd()
      } else if (ticket.value) {
        warnRefreshFailed()
      }
    } catch (error: unknown) {
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      toast.error(t("tickets.detail.toast.sendFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.detail.toast.sendFailedFallback")),
      })
    } finally {
      if (isActiveActionGeneration(generation)) {
        sending.value = false
      }
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
      const reloaded = await loadTicket({ silent: true })
      if (!isActiveActionGeneration(generation) || !isCurrentActionContext(userId, ticketIdValue)) return
      if (reloaded) {
        toast.success(t("tickets.detail.toast.closeSuccess"))
      } else if (ticket.value) {
        warnRefreshFailed()
      }
    } finally {
      if (isActiveActionGeneration(generation)) {
        closing.value = false
      }
    }
  }

  function isMe(message: TicketMessage) {
    return isOwnMessage(message, userStore.userId)
  }

  const canReply = computed(() => ticket.value !== null && canReplyToTicket(ticket.value.status))
  const canClose = computed(() => ticket.value !== null && canCloseTicket(ticket.value.status))

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
    document.addEventListener("visibilitychange", refreshWhenVisible)
  })

  onBeforeUnmount(() => {
    latestLoadRequestId += 1
    invalidateActions()
    if (sentTimer) clearTimeout(sentTimer)
    document.removeEventListener("visibilitychange", refreshWhenVisible)
  })

  return {
    loading,
    refreshing,
    loadError,
    notFound,
    ticket,
    messages,
    newMessage,
    replyLength,
    replyTooLong,
    canSend,
    sending,
    closing,
    justSent,
    canReply,
    canClose,
    loadTicket,
    refresh,
    sendMessage,
    handleClose,
    isMe,
  }
}
