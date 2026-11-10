<script setup lang="ts">
/**
 * An admin ticket's conversation as a flat thread: who (with a role chip),
 * when, and the text as written. Internal notes sit on an amber tint and say
 * so; system lines (status and assignee changes) are quiet centred lines.
 * The scrolling box and the reply form belong to the page.
 */
import { useI18n } from "vue-i18n"
import { LucideLock } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { roleLabel } from "@/modules/admin-users/constants"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import { describeAdminTicketSystemMessage } from "@/modules/tickets/lib/admin-ticket-display"
import { nameInitial } from "@/modules/tickets/lib/admin-ticket-thread"
import { splitMessageLinks } from "@/modules/tickets/lib/messages"
import type { UserRole } from "@/types/common"
import type { TicketMessage } from "@/types/ticket"

const props = defineProps<{
  messages: readonly TicketMessage[]
  /** The account role of a sender, when the page knows it (it loads the admin list for the assignee picker). */
  roleOf: (message: TicketMessage) => UserRole
}>()

const { t } = useI18n()

function senderLabel(message: TicketMessage): string {
  if (message.senderName) return message.senderName
  switch (message.senderRole) {
    case "admin":
      return t("tickets.adminDetail.adminSender")
    case "system":
      return t("tickets.adminDetail.systemSender")
    case "user":
    default:
      return t("tickets.adminDetail.userSender")
  }
}

function formatDateTime(value?: string): string {
  return formatLocalizedDateTime(value, "dateTime", t("tickets.common.dateFallback"))
}

function isStaff(message: TicketMessage): boolean {
  return props.roleOf(message) !== "user"
}
</script>

<template>
  <ol role="list" class="flex flex-col gap-1 p-2" data-slot="admin-ticket-thread">
    <li v-for="message in messages" :key="message.id" :data-sender-role="message.senderRole" :data-internal="message.internal || undefined">
      <!-- System line -->
      <p
        v-if="message.senderRole === 'system'"
        class="flex items-center gap-3 px-2 py-1 text-xs text-muted-foreground"
      >
        <span class="h-px min-w-4 flex-1 bg-border/60" aria-hidden="true" />
        <span class="min-w-0 text-center [overflow-wrap:anywhere]">
          {{ describeAdminTicketSystemMessage(message.message, t) }}
          <time :datetime="message.createdAt" class="ml-1 whitespace-nowrap tabular-nums opacity-80">{{ formatDateTime(message.createdAt) }}</time>
        </span>
        <span class="h-px min-w-4 flex-1 bg-border/60" aria-hidden="true" />
      </p>

      <!-- Message -->
      <article
        v-else
        :class="['flex gap-3 rounded-lg px-2 py-2.5', message.internal ? 'bg-amber-500/10' : '']"
      >
        <span
          :class="[
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            isStaff(message) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          ]"
          aria-hidden="true"
        >
          {{ nameInitial(senderLabel(message)) }}
        </span>
        <div class="min-w-0 flex-1">
          <header class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="max-w-full min-w-0 truncate text-sm font-medium" :title="message.senderId || undefined">{{ senderLabel(message) }}</span>
            <AdminTicketChip :tone="isStaff(message) ? 'primary' : 'neutral'">{{ roleLabel(roleOf(message), t) }}</AdminTicketChip>
            <AdminTicketChip v-if="message.internal" tone="warning" :icon="LucideLock">{{ t("tickets.adminDetail.internalTag") }}</AdminTicketChip>
            <time :datetime="message.createdAt" class="ml-auto text-xs whitespace-nowrap tabular-nums text-muted-foreground">
              {{ formatDateTime(message.createdAt) }}
            </time>
          </header>
          <p class="mt-1 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
            <template v-for="(segment, index) in splitMessageLinks(message.message)" :key="index">
              <a
                v-if="segment.type === 'link'"
                :href="segment.href"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="text-primary underline underline-offset-2"
              >{{ segment.value }}</a>
              <template v-else>{{ segment.value }}</template>
            </template>
          </p>
        </div>
      </article>
    </li>
  </ol>
</template>
