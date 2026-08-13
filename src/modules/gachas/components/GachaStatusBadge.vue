<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { GachaStatus } from "@/modules/gachas/lib/gacha-catalog"

const props = defineProps<{
  status: GachaStatus
}>()

const { t } = useI18n()

const badgeClass = computed(() => {
  if (props.status === "ongoing") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
  }

  return "bg-muted text-muted-foreground"
})
</script>

<template>
  <!-- "upcoming" is covered by the unreleased-content badge, so it renders nothing here. -->
  <span
    v-if="status !== 'upcoming'"
    :class="['inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', badgeClass]"
  >
    <span v-if="status === 'ongoing'" class="relative flex h-1.5 w-1.5" aria-hidden="true">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
      <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </span>
    {{ t(`gachas.status.${status}`) }}
  </span>
</template>
