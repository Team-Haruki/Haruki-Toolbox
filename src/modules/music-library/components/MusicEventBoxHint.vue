<script setup lang="ts">
import { useI18n } from "vue-i18n"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"

/** "某角色 N箱" hint for a box event song: avatar + short label, full sentence on hover. */
defineProps<{
  characterId: number
  name: string
  boxNumber: number
}>()

const { t } = useI18n()
</script>

<template>
  <span
    class="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
    :title="t('musicLibrary.eventBox.title', { name, count: boxNumber })"
    data-slot="music-event-box-hint"
  >
    <SekaiCharacterAvatar :character-id="characterId" :name="name" size="xs" class="size-3.5 ring-0" />
    <span class="truncate">{{ t("musicLibrary.eventBox.short", { name, count: boxNumber }) }}</span>
  </span>
</template>
