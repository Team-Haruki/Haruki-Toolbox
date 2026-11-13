<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue"
import { watchDebounced } from "@vueuse/core"
import { useI18n } from "vue-i18n"
import { LucideLoader2 } from "lucide-vue-next"
import { toast } from "vue-sonner"
import {
  exportImageEdit,
  isLossyExportFormat,
  listEncodableImageFormats,
  resolveEditedImageSize,
  saveBlob,
  type ExportedImage,
  type ImageExportFormat,
  type ImageSize,
  type ImageSource,
} from "image-edit-kit"
import {
  EXPORT_QUALITY,
  EXPORT_SCALES,
  buildExportResizeOps,
  formatFileSize,
  resolveExportFileName,
} from "@/lib/image-lightbox"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxSlider from "./LightboxSlider.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/**
 * Export: the picture as it stands, saved as PNG, JPEG or WebP at a chosen
 * quality and size. With no edit this is a plain format conversion, and the
 * file keeps the original's name. The file is encoded in the background as
 * the choices change, so its size shows before it is saved.
 */
const props = defineProps<{
  /** The picture with every edit so far applied. */
  source: ImageSource
  size: ImageSize
  /** Whether `source` differs from the original file's picture. */
  edited: boolean
  originalName: string
}>()

const emit = defineEmits<{
  cancel: []
  saved: []
}>()

const { t } = useI18n()

const FORMAT_LABELS: Record<ImageExportFormat, string> = { png: "PNG", jpeg: "JPEG", webp: "WebP" }

const formats = ref<ImageExportFormat[]>(["png"])
const format = ref<ImageExportFormat>("png")
const quality = ref<number>(EXPORT_QUALITY.initial)
const scale = ref<number>(1)
const saving = ref(false)

const lossy = computed(() => isLossyExportFormat(format.value))
const resizeOps = computed(() => buildExportResizeOps(props.size, scale.value))
const outputSize = computed(() => resolveEditedImageSize(props.size, resizeOps.value))
/** Everything the encoded file depends on. */
const settingsKey = computed(() => `${format.value}|${lossy.value ? quality.value : ""}|${scale.value}`)

function encode(): Promise<ExportedImage> {
  return exportImageEdit(props.source, resizeOps.value, { format: format.value, quality: quality.value / 100 })
}

const encoded = shallowRef<{ key: string; image: ExportedImage } | null>(null)
const current = computed(() => (encoded.value?.key === settingsKey.value ? encoded.value.image : null))
/** The background encode failed: the size stays unknown, and saving reports the failure. */
const sizeUnknown = ref(false)
let encodeToken = 0

async function refreshEncoded() {
  const token = ++encodeToken
  const key = settingsKey.value
  sizeUnknown.value = false
  try {
    const image = await encode()
    // A newer choice is already being encoded: this one is stale.
    if (token === encodeToken) {
      encoded.value = { key, image }
    }
  } catch {
    if (token === encodeToken) {
      sizeUnknown.value = true
    }
  }
}

watchDebounced(settingsKey, () => void refreshEncoded(), { debounce: 300, immediate: true })

let mounted = true

async function save() {
  if (saving.value) {
    return
  }
  saving.value = true
  try {
    const image = current.value ?? await encode()
    // Closed while encoding: the export was dismissed, nothing is downloaded.
    if (!mounted) {
      return
    }
    saveBlob(image.blob, resolveExportFileName(props.originalName, image.format, props.edited || resizeOps.value.length > 0))
    emit("saved")
  } catch {
    toast.error(t("catalog.lightbox.exportFailed"))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const available = await listEncodableImageFormats()
  if (mounted && available.length > 0) {
    formats.value = available
  }
})

onBeforeUnmount(() => {
  mounted = false
  encodeToken += 1
})
</script>

<template>
  <LightboxModeShell
    :label="t('catalog.lightbox.export')"
    :confirm-label="t('common.save')"
    :confirm-pending="saving"
    confirm-testid="image-viewer-export-save"
    @cancel="emit('cancel')"
    @confirm="save"
  >
    <template #panel>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 truncate text-xs text-white/70">{{ t("catalog.lightbox.exportFormat") }}</span>
          <div class="flex flex-wrap items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.exportFormat')">
            <LightboxToolButton
              v-for="option in formats"
              :key="option"
              variant="chip"
              :pressed="format === option"
              :data-format="option"
              @click="format = option"
            >
              {{ FORMAT_LABELS[option] }}
            </LightboxToolButton>
          </div>
        </div>
        <LightboxSlider
          v-if="lossy"
          v-model="quality"
          :label="t('catalog.lightbox.exportQuality')"
          :min="EXPORT_QUALITY.min"
          :max="EXPORT_QUALITY.max"
          :step="EXPORT_QUALITY.step"
          :readout="`${quality}%`"
          data-testid="image-viewer-export-quality"
        />
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 truncate text-xs text-white/70">{{ t("catalog.lightbox.exportSize") }}</span>
          <div class="flex flex-wrap items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.exportSize')">
            <LightboxToolButton
              v-for="option in EXPORT_SCALES"
              :key="option"
              variant="chip"
              :pressed="scale === option"
              :data-scale="option"
              @click="scale = option"
            >
              {{ Math.round(option * 100) }}%
            </LightboxToolButton>
          </div>
        </div>
        <p class="flex items-center gap-1.5 pl-18 text-xs tabular-nums text-white/70" data-testid="image-viewer-export-info">
          <span>{{ outputSize.width }} × {{ outputSize.height }}</span>
          <template v-if="current">
            <span aria-hidden="true">·</span>
            <span data-testid="image-viewer-export-file-size">{{ formatFileSize(current.blob.size) }}</span>
          </template>
          <LucideLoader2 v-else-if="!sizeUnknown" class="size-3.5 animate-spin" aria-hidden="true" />
        </p>
      </div>
    </template>
  </LightboxModeShell>
</template>
