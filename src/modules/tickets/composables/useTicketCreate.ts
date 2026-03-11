import { computed, ref } from "vue"
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

  async function handleSubmit() {
    if (submitting.value) return

    const userId = userStore.userId
    const normalizedSubject = subject.value.trim()
    const normalizedMessage = message.value.trim()

    if (!normalizedSubject) {
      toast.error(t("tickets.create.toast.subjectRequired"))
      return
    }
    if (!normalizedMessage) {
      toast.error(t("tickets.create.toast.messageRequired"))
      return
    }
    if (!userId) {
      toast.error(t("tickets.create.toast.loginRequired"))
      return
    }

    submitting.value = true
    try {
      await createTicket(userId, {
        subject: normalizedSubject,
        category: category.value,
        priority: priority.value,
        message: normalizedMessage,
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
    handleSubmit,
    goBackToTicketList,
  }
}
