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
  <div
    class="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border bg-card px-3 py-2.5 shadow-sm sm:px-4"
  >
    <template v-for="(item, index) in items" :key="`${index}-${item}`">
      <span v-if="index > 0" class="text-muted-foreground/50" aria-hidden="true">·</span>
      <span class="text-sm text-foreground/90">{{ item }}</span>
    </template>
    <div class="ml-auto flex shrink-0 items-center gap-2">
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
