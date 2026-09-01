<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideZoomIn, LucideZoomOut } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

/**
 * Full-size artwork viewer. `sources` are ordered candidates (same contract
 * as SekaiAssetImage); the first one that loads is the one "open in new tab"
 * points at.
 */
const props = withDefaults(defineProps<{
  sources: readonly (string | null | undefined)[]
  alt: string
  title?: string | null
  description?: string | null
}>(), {
  title: null,
  description: null,
})

const open = defineModel<boolean>("open", { default: false })

const { t } = useI18n()

const zoomed = ref(false)
const loadedUrl = ref<string | null>(null)

watch(open, (value) => {
  if (!value) {
    zoomed.value = false
  }
})

watch(() => props.sources.join("\n"), () => {
  loadedUrl.value = null
  zoomed.value = false
})

const openUrl = computed(() => loadedUrl.value ?? props.sources.find((url): url is string => typeof url === "string" && url !== "") ?? null)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[min(96vw,80rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,80rem)] sm:p-0"
    >
      <div class="flex min-w-0 items-center gap-2 border-b py-2 pr-12 pl-4">
        <div class="min-w-0 flex-1">
          <DialogTitle class="truncate text-sm font-semibold">
            {{ title ?? alt }}
          </DialogTitle>
          <DialogDescription :class="description ? 'truncate text-xs text-muted-foreground' : 'sr-only'">
            {{ description ?? t("catalog.lightbox.description") }}
          </DialogDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 gap-1 px-2 text-xs"
          :aria-pressed="zoomed"
          @click="zoomed = !zoomed"
        >
          <LucideZoomOut v-if="zoomed" class="size-4" />
          <LucideZoomIn v-else class="size-4" />
          <span class="hidden sm:inline">{{ zoomed ? t("catalog.lightbox.zoomOut") : t("catalog.lightbox.zoomIn") }}</span>
        </Button>
        <Button v-if="openUrl" as-child variant="ghost" size="sm" class="h-8 gap-1 px-2 text-xs">
          <a :href="openUrl" target="_blank" rel="noopener noreferrer">
            <LucideExternalLink class="size-4" />
            <span class="hidden sm:inline">{{ t("catalog.lightbox.openInNewTab") }}</span>
          </a>
        </Button>
      </div>
      <div
        :class="[
          'relative min-h-0 flex-1 bg-black/90',
          zoomed ? 'overflow-auto' : 'overflow-hidden',
        ]"
      >
        <div
          :class="zoomed ? 'relative min-h-full w-[200%] max-w-none sm:w-[160%]' : 'relative h-[min(80dvh,60rem)] w-full'"
          :style="zoomed ? { aspectRatio: '7 / 4' } : undefined"
          @click="zoomed = !zoomed"
        >
          <SekaiAssetImage
            :sources="sources"
            :alt="alt"
            fit="contain"
            eager
            :img-class="zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'"
            placeholder-class="bg-transparent text-white/70"
            @load="loadedUrl = $event"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
