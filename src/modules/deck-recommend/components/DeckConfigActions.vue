<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  LucidePlay,
  LucideSave,
  LucideSettings2,
  LucideTrash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"

/** The config pane's action row: secondary actions on one line, the run button full width under them. */
defineProps<{
  running: boolean
  canRun: boolean
}>()

const emit = defineEmits<{
  expert: []
  save: []
  clear: []
  run: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid gap-2 px-3 py-3 sm:px-4">
    <div class="grid grid-cols-3 gap-1.5 sm:gap-2">
      <Button type="button" variant="outline" size="sm" class="min-w-0 px-1.5 text-xs sm:px-2.5" @click="emit('expert')">
        <LucideSettings2 class="size-4" />
        {{ t("deckRecommend.layers.expert.title") }}
      </Button>
      <Button type="button" variant="outline" size="sm" class="min-w-0 px-1.5 text-xs sm:px-2.5" :disabled="running" @click="emit('save')">
        <LucideSave class="size-4" />
        {{ t("deckRecommend.configActions.save") }}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="min-w-0 px-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-2.5"
        :disabled="running"
        @click="emit('clear')"
      >
        <LucideTrash2 class="size-4" />
        {{ t("deckRecommend.configActions.clear") }}
      </Button>
    </div>
    <Button type="button" class="w-full" :disabled="!canRun" @click="emit('run')">
      <LucidePlay class="size-4" />
      {{ running ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
    </Button>
  </div>
</template>
