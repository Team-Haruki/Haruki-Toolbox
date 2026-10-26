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
} from "@/modules/tickets/lib/meta"

export const TICKET_SUBJECT_MAX_LENGTH = 200

type TicketCreateField = "subject" | "message"

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
  const fieldErrors = reactive<Record<TicketCreateField, string>>({ subject: "", message: "" })

  function focusField(field: TicketCreateField) {
    void nextTick(() => {
      const element = document.getElementById(field)
      if (element instanceof HTMLElement) {
        element.focus()
      }
    })
  }

  function clearFieldError(field: TicketCreateField) {
    fieldErrors[field] = ""
  }

  function validate(): boolean {
    const normalizedSubject = subject.value.trim()
    const normalizedMessage = message.value.trim()
    fieldErrors.subject = !normalizedSubject
      ? t("tickets.create.toast.subjectRequired")
      : normalizedSubject.length > TICKET_SUBJECT_MAX_LENGTH
        ? t("tickets.create.toast.subjectTooLong", { max: TICKET_SUBJECT_MAX_LENGTH })
        : ""
    fieldErrors.message = normalizedMessage ? "" : t("tickets.create.toast.messageRequired")

    const firstInvalid = (["subject", "message"] as const).find((field) => fieldErrors[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return false
    }
    return true
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
      await createTicket(userId, {
        subject: subject.value.trim(),
        category: category.value,
        priority: priority.value,
        message: message.value.trim(),
      })
      toast.success(t("tickets.create.toast.createSuccess"))
      void router.push({ name: "tickets.list" })
    } catch (error: unknown) {
      toast.error(t("tickets.create.toast.createFailedTitle"), {
        description: extractErrorMessage(error, t("tickets.create.toast.createFailedFallback")),
      })
    } finally {
      submitting.value = false
    }
  }

  function goBackToTicketList() {
    void router.push({ name: "tickets.list" })
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
    clearFieldError,
    handleSubmit,
    goBackToTicketList,
  }
}
