<script setup lang="ts">
/**
 * A user's own ticket as a conversation: a flat thread like the admin one
 * (`AdminTicketThread`), told from the user's side. Each message says who
 * wrote it ("you" or the admin) and at what time; a date line marks where
 * the day changes, so a message only carries its clock time. The admin's
 * replies are the ones the user came for: their avatar wears the primary
 * tint. The surface, the "show earlier" button and the reply box belong to
 * the page.
 */
import { useI18n } from "vue-i18n"
import { LucideHeadset } from "lucide-vue-next"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import { nameInitial } from "@/modules/tickets/lib/admin-ticket-thread"
import { describeSystemMessage, splitMessageLinks } from "@/modules/tickets/lib/messages"
import type { ThreadEntry } from "@/modules/tickets/lib/user-ticket-thread"
import type { TicketMessage } from "@/types/ticket"

defineProps<{
  entries: readonly ThreadEntry[]
  isOwn: (message: TicketMessage) => boolean
  /** The signed-in user's display name, for the initial in their avatar. */
  ownName?: string
}>()

const { t } = useI18n()

function fallback(): string {
  return t("tickets.common.dateFallback")
}

function formatDay(value: string): string {
  return formatLocalizedDate(value, "date", fallback())
}

function formatClock(value: string): string {
  return formatLocalizedDateTime(value, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, fallback())
}

function formatDateTime(value: string): string {
  return formatLocalizedDateTime(value, "dateTime", fallback())
}
</script>

<template>
  <ol role="list" class="flex flex-col py-1.5" data-slot="ticket-thread">
    <li v-for="entry in entries" :key="entry.key">
      <!-- Day line -->
      <p v-if="entry.kind === 'day'" class="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground" data-thread="day">
        <span class="h-px min-w-4 flex-1 bg-border/60" aria-hidden="true" />
        <time :datetime="entry.at" class="tabular-nums">{{ formatDay(entry.at) }}</time>
        <span class="h-px min-w-4 flex-1 bg-border/60" aria-hidden="true" />
      </p>

      <!-- System line: the backend keeps these internal today, but a visible one reads as a quiet note. -->
      <p
        v-else-if="entry.message.senderRole === 'system'"
        class="px-4 py-1.5 text-center text-xs text-muted-foreground [overflow-wrap:anywhere]"
        data-thread="system"
      >
        {{ describeSystemMessage(entry.message.message) }}
        <time :datetime="entry.message.createdAt" class="ml-1 whitespace-nowrap tabular-nums opacity-80">{{ formatClock(entry.message.createdAt) }}</time>
      </p>

      <!-- Message -->
      <article v-else class="flex gap-3 px-4 py-2.5" data-thread="message" :data-sender="isOwn(entry.message) ? 'self' : 'admin'">
        <span
          :class="[
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            isOwn(entry.message) ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
          ]"
          aria-hidden="true"
        >
          <template v-if="isOwn(entry.message)">{{ nameInitial(ownName) }}</template>
          <LucideHeadset v-else class="size-4" />
        </span>
        <div class="min-w-0 flex-1">
          <header class="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <span class="max-w-full min-w-0 truncate text-sm font-medium">
              {{ isOwn(entry.message) ? t("tickets.detail.selfSender") : entry.message.senderName || t("tickets.detail.adminSender") }}
            </span>
            <time
              :datetime="entry.message.createdAt"
              :title="formatDateTime(entry.message.createdAt)"
              class="text-xs whitespace-nowrap tabular-nums text-muted-foreground"
            >
              {{ formatClock(entry.message.createdAt) }}
            </time>
          </header>
          <p class="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
            <template v-for="(segment, index) in splitMessageLinks(entry.message.message)" :key="index">
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
