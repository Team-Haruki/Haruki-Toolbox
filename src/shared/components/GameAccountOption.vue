<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideBadgeCheck } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { maskGameUserId } from "@/lib/game-account-display"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { useSettingsStore } from "@/shared/stores/settings"

const props = defineProps<{
  server: string
  userId: string | number
  verified?: boolean
  isDefault?: boolean
  ownership?: "own" | "granted"
  /** Display name of the granting user, shown for granted accounts. */
  ownerName?: string | null
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

// Per-region accent so each bound account is visually distinct at a glance.
const REGION_BADGE_CLASSES: Record<SekaiRegion, string> = {
  jp: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  en: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  tw: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  kr: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  cn: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
}

function regionBadgeClass(server: string): string {
  return REGION_BADGE_CLASSES[server as SekaiRegion] ?? "bg-muted text-muted-foreground"
}

function regionShort(server: string): string {
  return server.slice(0, 2).toUpperCase()
}

function displayUid(userId: string | number): string {
  return settingsStore.hideGameUserId ? maskGameUserId(userId) : String(userId)
}
</script>

<template>
  <span class="flex min-w-0 flex-1 items-center gap-2">
    <span
      class="flex size-6 shrink-0 items-center justify-center rounded text-[10px] font-bold tracking-wide"
      :class="regionBadgeClass(props.server)"
    >
      {{ regionShort(props.server) }}
    </span>
    <span class="truncate text-sm font-medium">{{ resolveSekaiRegionLabel(props.server, t) }}</span>
    <span class="min-w-0 truncate text-xs tabular-nums text-muted-foreground" :title="displayUid(props.userId)">{{ displayUid(props.userId) }}</span>
    <span
      v-if="props.ownership === 'granted' && props.ownerName"
      class="min-w-0 truncate text-xs text-muted-foreground"
      :title="props.ownerName"
    >
      {{ props.ownerName }}
    </span>
    <span class="ml-auto flex shrink-0 items-center gap-1.5">
      <span
        v-if="props.ownership === 'granted'"
        class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      >
        {{ t("gameAccountSelect.grantedBadge") }}
      </span>
      <span
        v-if="props.isDefault"
        class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
      >
        {{ t("gameAccountSelect.default") }}
      </span>
      <LucideBadgeCheck
        v-if="props.verified && props.ownership !== 'granted'"
        class="size-4 text-emerald-500"
        :aria-label="t('gameAccountSelect.verified')"
      />
    </span>
  </span>
</template>
