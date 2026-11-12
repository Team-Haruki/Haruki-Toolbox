import { computed, nextTick, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { createTicket } from "@/modules/tickets/api/user"
import type { TicketCategory, TicketPriority } from "@/types/ticket"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  getTicketCategoryOptions,
  getTicketPriorityOptions,
  isTicketCategory,
  isTicketPriority,
} from "@/modules/tickets/lib/meta"
import {
  checkTicketText,
  countCharacters,
  firstInvalidField,
  TICKET_MESSAGE_MAX_LENGTH,
  TICKET_SUBJECT_MAX_LENGTH,
  validateTicketDraft,
  type TicketDraftField,
  type TicketTextIssue,
} from "@/modules/tickets/lib/ticket-draft"
import { ticketCategoryGuideKey } from "@/modules/tickets/lib/user-ticket"

const FIELD_MAX_LENGTH: Readonly<Record<TicketDraftField, number>> = {
  subject: TICKET_SUBJECT_MAX_LENGTH,
  message: TICKET_MESSAGE_MAX_LENGTH,
}

/** The element ids of the form's two text fields (labels, focus and `aria-describedby` hang off them). */
export const TICKET_CREATE_FIELD_IDS: Readonly<Record<TicketDraftField, string>> = {
  subject: "ticket-subject",
  message: "ticket-message",
}

export function useTicketCreate() {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()

  const subject = ref("")
  const category = ref<TicketCategory>("other")
  const priority = ref<TicketPriority>("normal")
  const message = ref("")
  const submitting = ref(false)
  const categories = computed(() => getTicketCategoryOptions(t))
  const priorities = computed(() => getTicketPriorityOptions(t))
  /** Inline validation messages per field; empty when the field is valid. */
  const fieldErrors = reactive<Record<TicketDraftField, string>>({ subject: "", message: "" })

  const subjectLength = computed(() => countCharacters(subject.value.trim()))
  const messageLength = computed(() => countCharacters(message.value.trim()))
  /** What a description of the chosen category should contain. */
  const messageGuide = computed(() => t(ticketCategoryGuideKey(category.value)))

  function issueText(field: TicketDraftField, issue: TicketTextIssue | null): string {
    if (!issue) return ""
    if (issue === "tooLong") {
      return t(field === "subject" ? "tickets.create.toast.subjectTooLong" : "tickets.create.toast.messageTooLong", {
        max: FIELD_MAX_LENGTH[field],
      })
    }
    return t(field === "subject" ? "tickets.create.toast.subjectRequired" : "tickets.create.toast.messageRequired")
  }

  function focusField(field: TicketDraftField) {
    void nextTick(() => {
      const element = document.getElementById(TICKET_CREATE_FIELD_IDS[field])
      if (element instanceof HTMLElement) {
        element.focus()
      }
    })
  }

  function fieldText(field: TicketDraftField): string {
    return field === "subject" ? subject.value : message.value
  }

  /**
   * While typing: running past the limit is said at once (the counter turns
   * with it); any other error clears on the next keystroke.
   */
  function handleFieldInput(field: TicketDraftField) {
    const issue = checkTicketText(fieldText(field), FIELD_MAX_LENGTH[field])
    fieldErrors[field] = issue === "tooLong" ? issueText(field, issue) : ""
  }

  /** Leaving a field the user has written in checks it; an untouched empty field waits for submit. */
  function handleFieldBlur(field: TicketDraftField) {
    if (fieldText(field) === "") return
    fieldErrors[field] = issueText(field, checkTicketText(fieldText(field), FIELD_MAX_LENGTH[field]))
  }

  function validate(): boolean {
    const issues = validateTicketDraft({ subject: subject.value, message: message.value })
    fieldErrors.subject = issueText("subject", issues.subject)
    fieldErrors.message = issueText("message", issues.message)

    const firstInvalid = firstInvalidField(issues)
    if (firstInvalid) {
      focusField(firstInvalid)
      return false
    }
    return true
  }

  function setCategory(value: unknown) {
    if (isTicketCategory(value)) category.value = value
  }

  function setPriority(value: unknown) {
    if (isTicketPriority(value)) priority.value = value
  }

  async function handleSubmit() {
    if (submitting.value) return
    if (!validate()) return

    const userId = userStore.userId
    if (!userId) {
      toast.error(t("tickets.create.toast.loginRequired"))
      return
    }

    submitting.value = true
    try {
      const ticketId = await createTicket(userId, {
        subject: subject.value.trim(),
        category: category.value,
        priority: priority.value,
        message: message.value.trim(),
      })
      toast.success(t("tickets.create.toast.createSuccess"))
      // Straight to the new ticket; `replace`, so Back does not return to a blank form.
      void router.replace(ticketId ? { name: "tickets.detail", params: { ticketId } } : { name: "tickets.list" })
    } catch (error: unknown) {
      toast.error(t("tickets.create.toast.createFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.create.toast.createFailedFallback")),
      })
    } finally {
      submitting.value = false
    }
  }

  return {
    subject,
    category,
    priority,
    message,
    submitting,
    categories,
    priorities,
    fieldErrors,
    subjectLength,
    messageLength,
    messageGuide,
    handleFieldInput,
    handleFieldBlur,
    setCategory,
    setPriority,
    handleSubmit,
  }
}
