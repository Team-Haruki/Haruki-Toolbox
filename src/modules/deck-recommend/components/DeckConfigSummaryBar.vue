<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucidePlay, LucideSettings2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineProps<{
  items: string[]
  running: boolean
  canRun: boolean
}>()

const emit = defineEmits<{
  edit: []
  run: []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- The collapsed config on a single-column page: what will run, as chips,
       with "edit" and "run again" at the end. -->
  <div class="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card px-3 py-2.5 sm:px-4">
    <span
      v-for="(item, index) in items"
      :key="`${index}-${item}`"
      class="min-w-0 rounded-md bg-muted px-1.5 py-0.5 text-xs break-words [overflow-wrap:anywhere] text-foreground/90"
    >
      {{ item }}
    </span>
    <div class="ml-auto flex max-w-full flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" @click="emit('edit')">
        <LucideSettings2 class="size-4" />
        {{ t("deckRecommend.summaryBar.edit") }}
      </Button>
      <Button type="button" size="sm" :disabled="!canRun" @click="emit('run')">
        <LucidePlay class="size-4" />
        {{ running ? t("deckRecommend.runner.running") : t("deckRecommend.summaryBar.rerun") }}
      </Button>
    </div>
  </div>
</template>
