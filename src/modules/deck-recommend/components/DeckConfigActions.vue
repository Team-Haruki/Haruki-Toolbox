<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  LucidePlay,
  LucideSave,
  LucideSettings2,
  LucideTrash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"

/**
 * The config pane's action row: one line at every width, so the sticky bar
 * covers as little of the form as possible. Save and clear are icon buttons
 * (their labels stay for assistive tech and as tooltips), the expert sheet
 * keeps its name from `sm` up, and the run button takes the rest. `hint`
 * explains why the run button is disabled (no account bound, no uploaded
 * data…).
 */
withDefaults(defineProps<{
  running: boolean
  canRun: boolean
  hint?: string | null
}>(), {
  hint: null,
})

const emit = defineEmits<{
  expert: []
  save: []
  clear: []
  run: []
}>()

const { t } = useI18n()

const secondaryClass = "h-10 min-w-10 shrink-0 gap-1 px-2.5 text-xs leading-tight sm:h-9 sm:min-w-9"
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
    <div class="flex shrink-0 items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" :class="secondaryClass" :title="t('deckRecommend.layers.expert.title')" @click="emit('expert')">
        <LucideSettings2 class="size-4" />
        <span class="sr-only sm:not-sr-only">{{ t("deckRecommend.layers.expert.title") }}</span>
      </Button>
      <Button type="button" variant="outline" size="sm" :class="secondaryClass" :title="t('deckRecommend.configActions.save')" :disabled="running" @click="emit('save')">
        <LucideSave class="size-4" />
        <span class="sr-only">{{ t("deckRecommend.configActions.save") }}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :class="[secondaryClass, 'text-destructive hover:bg-destructive/10 hover:text-destructive']"
        :title="t('deckRecommend.configActions.clear')"
        :disabled="running"
        @click="emit('clear')"
      >
        <LucideTrash2 class="size-4" />
        <span class="sr-only">{{ t("deckRecommend.configActions.clear") }}</span>
      </Button>
    </div>
    <!-- basis-36: when the label does not fit beside the icon buttons (320 px with
         enlarged text) the run button wraps onto its own full-width row instead
         of clipping its text -->
    <Button type="button" class="h-10 min-w-0 flex-1 basis-36 sm:h-9" :disabled="!canRun" @click="emit('run')">
      <LucidePlay class="size-4" />
      {{ running ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
    </Button>
    <p v-if="hint && !running" class="w-full text-center text-xs text-muted-foreground" role="status">
      {{ hint }}
    </p>
  </div>
</template>
