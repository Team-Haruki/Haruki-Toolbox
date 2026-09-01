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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

export type ImageLightboxItem = {
  /** Tab label (Normal / Trained, Banner / Logo…). */
  label: string
  /** Ordered candidate URLs, same contract as SekaiAssetImage. */
  sources: readonly (string | null | undefined)[]
  alt?: string
}

/**
 * Full-size artwork viewer with optional item tabs. Pointer devices toggle a
 * 2× zoom on click; touch devices pinch-zoom natively (the image box opts
 * out of the dialog's touch handling with `touch-action: pinch-zoom`).
 */
const props = withDefaults(defineProps<{
  items: readonly ImageLightboxItem[]
  title?: string | null
  description?: string | null
}>(), {
  title: null,
  description: null,
})

const open = defineModel<boolean>("open", { default: false })
const index = defineModel<number>("index", { default: 0 })

const { t } = useI18n()

const zoomed = ref(false)
const loadedUrl = ref<string | null>(null)

const current = computed(() => props.items[Math.min(Math.max(0, index.value), Math.max(0, props.items.length - 1))] ?? null)

watch(open, (value) => {
  if (!value) {
    zoomed.value = false
  }
})

watch(() => current.value?.sources.join("\n"), () => {
  loadedUrl.value = null
  zoomed.value = false
})

const openUrl = computed(() => (
  loadedUrl.value
  ?? current.value?.sources.find((url): url is string => typeof url === "string" && url !== "")
  ?? null
))

function selectItem(value: unknown) {
  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 0 && parsed < props.items.length) {
    index.value = parsed
  }
}

function toggleZoom(event: MouseEvent) {
  // Touch devices pinch-zoom natively; click-to-zoom is for pointers.
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) {
    return
  }
  event.preventDefault()
  zoomed.value = !zoomed.value
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[min(96vw,80rem)] sm:rounded-lg sm:border sm:p-0"
    >
      <div class="flex min-w-0 items-center gap-2 border-b py-2 pr-12 pl-3 sm:pl-4">
        <div class="min-w-0 flex-1">
          <DialogTitle class="truncate text-sm font-semibold">
            {{ title ?? current?.alt ?? current?.label ?? "" }}
          </DialogTitle>
          <DialogDescription :class="description ? 'truncate text-xs text-muted-foreground' : 'sr-only'">
            {{ description ?? t("catalog.lightbox.description") }}
          </DialogDescription>
        </div>
        <ToggleGroup
          v-if="items.length > 1"
          type="single"
          variant="segment"
          size="sm"
          :model-value="String(index)"
          :aria-label="t('catalog.lightbox.items')"
          @update:model-value="selectItem"
        >
          <ToggleGroupItem v-for="(item, itemIndex) in items" :key="itemIndex" :value="String(itemIndex)">
            {{ item.label }}
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="ghost"
          size="sm"
          class="hidden h-8 gap-1 px-2 text-xs [@media(pointer:fine)]:inline-flex"
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
        class="relative min-h-0 flex-1 overflow-auto bg-black/90"
        style="touch-action: pinch-zoom"
      >
        <div
          :class="zoomed ? 'relative aspect-[7/4] w-[200%] max-w-none' : 'relative h-[min(82dvh,60rem)] w-full'"
          @click="toggleZoom"
        >
          <SekaiAssetImage
            v-if="current"
            :sources="current.sources"
            :alt="current.alt ?? current.label"
            fit="contain"
            eager
            :img-class="zoomed ? 'cursor-zoom-out' : '[@media(pointer:fine)]:cursor-zoom-in'"
            placeholder-class="bg-transparent text-white/70"
            @load="loadedUrl = $event"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
