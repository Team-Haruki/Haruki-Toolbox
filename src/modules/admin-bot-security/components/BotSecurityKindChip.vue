<script setup lang="ts">
import { computed, type Component } from "vue"
import {
  LucideCircleHelp,
  LucideGauge,
  LucideKeyRound,
  LucideLogOut,
  LucideMapPin,
  LucideMonitorSmartphone,
  LucidePackageX,
  LucideRepeat,
  LucideShieldOff,
} from "lucide-vue-next"
import { type BotSecurityKindTone, botSecurityKindTone } from "@/modules/admin-bot-security/lib/alert-stats"

/**
 * The kind of an alert as a tinted chip: an icon per known kind and a tint
 * per family (credential misuse, limits, client changes). A kind this build
 * does not know keeps the neutral chip and shows its raw value.
 */
const props = defineProps<{
  kind: string
  label: string
}>()

const KIND_ICONS: Readonly<Record<string, Component>> = {
  auth_failed: LucideKeyRound,
  replay_detected: LucideRepeat,
  rate_limited: LucideGauge,
  build_rejected: LucidePackageX,
  session_revoked: LucideLogOut,
  login_source_changed: LucideMapPin,
  client_changed: LucideMonitorSmartphone,
  policy_unavailable: LucideShieldOff,
}

const TONE_CLASS: Record<BotSecurityKindTone, string> = {
  danger: "bg-destructive/15 text-destructive-tint-foreground",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  neutral: "bg-muted text-foreground",
}

const icon = computed(() => (Object.hasOwn(KIND_ICONS, props.kind) ? KIND_ICONS[props.kind] : LucideCircleHelp))
</script>

<template>
  <span
    :class="['inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLASS[botSecurityKindTone(props.kind)]]"
    :title="props.kind"
  >
    <component :is="icon" class="size-3 shrink-0" aria-hidden="true" />
    <span class="min-w-0 truncate">{{ props.label }}</span>
  </span>
</template>
