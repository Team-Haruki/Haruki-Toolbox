<script setup lang="ts">
/**
 * The small tinted chip of the admin ticket pages: a status, a priority, a
 * category, a role. The text always says what it is; the tone only helps
 * the eye find it in a column.
 *
 *   <AdminTicketChip :tone="adminTicketStatusTone(status)" :icon="ticketStatusIcon(status)">
 *     {{ ticketStatusLabel(status) }}
 *   </AdminTicketChip>
 */
import type { Component } from "vue"
import { ADMIN_TICKET_TONE_CLASS, type AdminTicketTone } from "@/modules/tickets/lib/admin-ticket-display"

withDefaults(defineProps<{
  tone?: AdminTicketTone
  icon?: Component | null
}>(), {
  tone: "neutral",
  icon: null,
})
</script>

<template>
  <span
    :class="['inline-flex max-w-full shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap', ADMIN_TICKET_TONE_CLASS[tone]]"
    data-slot="admin-ticket-chip"
  >
    <component :is="icon" v-if="icon" class="size-3 shrink-0" aria-hidden="true" />
    <span class="min-w-0 truncate"><slot /></span>
  </span>
</template>
