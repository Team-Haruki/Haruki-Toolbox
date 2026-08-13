<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  LucidePlay,
  LucideSave,
  LucideSettings2,
  LucideTrash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineProps<{
  variant: "desktop" | "mobile"
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
  <div v-if="variant === 'desktop'" class="ml-auto hidden flex-wrap items-center gap-2 md:flex">
    <Button type="button" variant="outline" size="sm" @click="emit('expert')">
      <LucideSettings2 class="size-4" />
      {{ t("deckRecommend.layers.expert.title") }}
    </Button>
    <Button type="button" variant="outline" size="sm" :disabled="running" @click="emit('save')">
      <LucideSave class="size-4" />
      {{ t("deckRecommend.configActions.save") }}
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="text-destructive hover:bg-destructive/10 hover:text-destructive"
      :disabled="running"
      @click="emit('clear')"
    >
      <LucideTrash2 class="size-4" />
      {{ t("deckRecommend.configActions.clear") }}
    </Button>
    <Button type="button" size="sm" class="min-w-28" :disabled="!canRun" @click="emit('run')">
      <LucidePlay class="size-4" />
      {{ running ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
    </Button>
  </div>
  <div v-else class="grid gap-2 border-t px-3 py-3 md:hidden">
    <div class="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" class="flex-1" @click="emit('expert')">
        <LucideSettings2 class="size-4" />
        {{ t("deckRecommend.layers.expert.title") }}
      </Button>
      <Button type="button" variant="outline" size="sm" class="flex-1" :disabled="running" @click="emit('save')">
        <LucideSave class="size-4" />
        {{ t("deckRecommend.configActions.save") }}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
