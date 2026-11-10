<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Tags } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"

const ALIAS_COLLAPSED_LIMIT = 12

/**
 * The community's names for a song, as a labelled line of chips for the song
 * header; a long list folds after the first few. Renders nothing without aliases.
 */
const props = defineProps<{
  musicId: number
  aliases: readonly string[]
}>()

const { t } = useI18n()

const expanded = ref(false)
watch(() => props.musicId, () => {
  expanded.value = false
})

const visibleAliases = computed(() => (expanded.value ? props.aliases : props.aliases.slice(0, ALIAS_COLLAPSED_LIMIT)))
const hiddenCount = computed(() => Math.max(props.aliases.length - visibleAliases.value.length, 0))
const toggleClass = "inline-flex min-h-6 items-center rounded-full border border-dashed px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-8"
</script>

<template>
  <div v-if="aliases.length > 0" class="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-start sm:gap-2.5" data-testid="music-detail-aliases">
    <p class="flex shrink-0 items-center gap-1.5 text-muted-foreground sm:mt-0.5">
      <Tags class="size-4 shrink-0" aria-hidden="true" />
      {{ t("musicLibrary.detail.aliases.title") }}
    </p>
    <div class="flex min-w-0 flex-1 flex-wrap gap-1.5">
      <Badge v-for="alias in visibleAliases" :key="alias" variant="outline" class="max-w-full bg-background/70 dark:bg-input/30">
        <span class="truncate">{{ alias }}</span>
      </Badge>
      <button v-if="hiddenCount > 0" type="button" :class="toggleClass" @click="expanded = true">
        {{ t("musicLibrary.detail.aliases.showMore", { count: hiddenCount }) }}
      </button>
      <button v-else-if="expanded && aliases.length > ALIAS_COLLAPSED_LIMIT" type="button" :class="toggleClass" @click="expanded = false">
        {{ t("musicLibrary.detail.aliases.showLess") }}
      </button>
    </div>
  </div>
</template>
