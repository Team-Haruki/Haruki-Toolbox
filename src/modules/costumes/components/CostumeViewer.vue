<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoaderCircle, LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import type { Haruki3DKernel } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import { costumeLoadTracker, loadCostumeContent, loadCostumeEngine, resolveCostumeContentBaseUrl } from "../lib/costume-content"
import { formatMegabytes, type CostumeLoadProgress } from "../lib/costume-load-progress"
import type { CostumeMotionType } from "../lib/costume-motions"

export type CostumeViewerRecipe = {
  characterId: number
  unit: string
  bodyCostume3dId: number
  headCostume3dId: number
  hairCostume3dId: number
  /** Which motion plays: the role's CostumeShop motion when absent ("costume"). */
  motionType?: CostumeMotionType
  /** Whose motion (`<characterId>:<unit>`); absent: the role's own. */
  motionRoleId?: string | null
  /**
   * Only the head accessory (`headCostume3dId`, a head_optional part of the role): the kernel reads its bundle alone,
   * without the character, and frames it on its own.
   */
  accessoryOnly?: boolean
  /** Experimental: a hairstyle of this character in the role's own hair colours, instead of the hair. */
  hairFromCharacterId?: number | null
  /** With hairFromCharacterId: which of its hairs (absent: its default). */
  hairFromCostume3dId?: number | null
  /** Experimental: headCostume3dId is a full head set of this character, its hair in the role's colours. */
  headFromCharacterId?: number | null
  /** Experimental: this character's default outfit, in its figure, instead of the body. */
  bodyFromCharacterId?: number | null
}

/** "archive": the game's backdrop (the character archive costume viewer's); "transparent": the frame's plain color. */
export type CostumeViewerBackground = "archive" | "transparent"


const props = withDefaults(defineProps<{
  region: SekaiRegion
  recipe: CostumeViewerRecipe | null
  /** Sizing lives with the caller; the default keeps the card-detail embed as it was. */
  class?: string
  /**
   * Zoom with the mouse wheel. Off for viewers embedded in a scrolling page,
   * where a wheel-capturing canvas would hijack the scroll; pinch, drag and
   * the exposed `zoomBy` keep working.
   */
  wheelZoom?: boolean
  background?: CostumeViewerBackground
}>(), {
  class: "aspect-[7/5]",
  wheelZoom: true,
  background: "archive",
})

const { t } = useI18n()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLDivElement | null>(null)
const status = ref<"idle" | "loading" | "ready" | "error">("idle")
/** The current load's bundle downloads; null until the kernel asks for its first bundle. */
const loadProgress = ref<CostumeLoadProgress | null>(null)
let stopLoadProgress: (() => void) | null = null

function watchLoadProgress() {
  stopLoadProgress?.()
  const tracker = costumeLoadTracker(contentBaseUrl.value)
  const start = tracker.mark()
  loadProgress.value = null
  stopLoadProgress = tracker.subscribe(() => {
    const progress = tracker.progressSince(start)
    loadProgress.value = progress.requested > 0 ? progress : null
  })
}

function endLoadProgress() {
  stopLoadProgress?.()
  stopLoadProgress = null
  loadProgress.value = null
}
const errorMessage = ref<string | null>(null)

const settingsStore = useSettingsStore()
// The region's raw-bundle mirror on the asset CDN (AssetBundleInfo, original bundles, master rows).
const contentBaseUrl = computed(() => resolveCostumeContentBaseUrl(settingsStore.currentAssetEndpoint, props.region))

let kernel: Haruki3DKernel | null = null
let kernelBaseUrl: string | null = null
let resizeObserver: ResizeObserver | null = null
let loadGeneration = 0

/**
 * The kernel for the current content root, created when the root changed. `generation` is the load asking: a newer
 * load started while this one waited takes over, so a stale call neither creates nor replaces the kernel.
 */
async function ensureKernel(generation: number): Promise<Haruki3DKernel | null> {
  const canvas = canvasRef.value
  if (canvas == null) {
    return null
  }

  const baseUrl = contentBaseUrl.value
  if (kernel != null && kernelBaseUrl === baseUrl) {
    return kernel
  }

  await disposeKernel()
  if (generation !== loadGeneration) {
    return null
  }
  const [engine, content] = await Promise.all([loadCostumeEngine(), loadCostumeContent(baseUrl)])
  if (generation !== loadGeneration || canvasRef.value !== canvas) {
    return null
  }
  // The game's own backdrop (the character archive costume viewer's) unless the caller asks for the plain frame.
  kernel = engine.createHaruki3DKernel({ canvas, content, background: props.background })
  frameHeightAt = engine.studioViewFrameHeight
  kernelBaseUrl = baseUrl
  applySize()
  return kernel
}

async function disposeKernel() {
  const current = kernel
  kernel = null
  kernelBaseUrl = null
  if (current != null) {
    await current.destroy().catch(() => {})
  }
}

function applySize() {
  const canvas = canvasRef.value
  if (canvas != null && kernel != null) {
    // The canvas's own box (inside the frame's border), so its buffer maps 1:1 onto it.
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width > 0 && height > 0) {
      // CSS pixels: the kernel draws at the device pixel ratio, supersampled offscreen, and widens the outline when
      // the viewer is small.
      kernel.resize(width, height)
    }
  }
}

async function loadRecipe() {
  const recipe = props.recipe
  const generation = ++loadGeneration
  if (recipe == null) {
    status.value = "idle"
    return
  }

  status.value = "loading"
  errorMessage.value = null
  watchLoadProgress()
  try {
    const activeKernel = await ensureKernel(generation)
    if (activeKernel == null || generation !== loadGeneration) {
      return
    }

    const roleId = `${recipe.characterId}:${recipe.unit}`
    await activeKernel.load(recipe.accessoryOnly ? {
      kind: "head_optional",
      roleId,
      headOptionalCostume3dId: recipe.headCostume3dId,
    } : {
      roleId,
      bodyCostume3dId: recipe.bodyCostume3dId,
      headCostume3dId: recipe.headCostume3dId,
      hairCostume3dId: recipe.hairCostume3dId,
      headOptionalCostume3dId: null,
      motionType: recipe.motionType ?? "costume",
      motionRoleId: recipe.motionRoleId ?? null,
      hairFromCharacterId: recipe.hairFromCharacterId ?? null,
      hairFromCostume3dId: recipe.hairFromCostume3dId ?? null,
      headFromCharacterId: recipe.headFromCharacterId ?? null,
      bodyFromCharacterId: recipe.bodyFromCharacterId ?? null,
    })
    if (generation !== loadGeneration) {
      return
    }

    // Loading resets CameraRoot; restore the user's view without moving the model.
    applyView(activeKernel)
    activeKernel.play()
    status.value = "ready"
  } catch (loadError) {
    if (generation !== loadGeneration) {
      return
    }
    errorMessage.value = loadError instanceof Error ? loadError.message : String(loadError)
    status.value = "error"
  } finally {
    if (generation === loadGeneration) {
      endLoadProgress()
    }
  }
}

// --- View: drag to orbit / pan, wheel or pinch to zoom -----------------------
// Mirrors the game's CostumeShop: every gesture moves CameraRoot, never the
// character, so authored spring chains do not pick up false inertia.

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

let yawDegrees = 0
let zoom = 1
// The height offset the kernel applied: it keeps the view within the game's camera limits at the zoom (from the head
// down to the feet) and re-clamps it on a zoom change.
let heightOffset = 0
// The frame's height in metres at the character for a zoom (the engine's), for turning a drag into metres.
let frameHeightAt: ((zoom: number) => number) | null = null

function applyView(target: Haruki3DKernel | null = kernel) {
  if (target == null) {
    return
  }
  target.setViewYawDegrees(yawDegrees)
  target.setViewZoom(zoom)
  heightOffset = target.setViewHeightOffset(heightOffset).heightOffset
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Multiply the zoom by `factor` (>1 moves closer). */
function zoomBy(factor: number) {
  zoom = clamp(zoom * factor, ZOOM_MIN, ZOOM_MAX)
  if (kernel != null) {
    heightOffset = kernel.setViewZoom(zoom).heightOffset
  }
}

function panBy(metres: number) {
  if (kernel != null) {
    heightOffset = kernel.setViewHeightOffset(heightOffset + metres).heightOffset
  }
}

const activePointers = new Map<number, { x: number; y: number }>()
let pinchDistance: number | null = null

function pointerDistance() {
  const [a, b] = [...activePointers.values()]
  return a != null && b != null ? Math.hypot(b.x - a.x, b.y - a.y) : null
}

function handlePointerDown(event: PointerEvent) {
  if (status.value !== "ready" || kernel == null) {
    return
  }
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  pinchDistance = pointerDistance()
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  const previous = activePointers.get(event.pointerId)
  if (previous == null || kernel == null) {
    return
  }
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (activePointers.size >= 2) {
    // Pinch: the change in finger distance scales the zoom.
    const distance = pointerDistance()
    if (distance != null && pinchDistance != null && pinchDistance > 0) {
      zoomBy(distance / pinchDistance)
    }
    pinchDistance = distance
    return
  }

  const deltaX = event.clientX - previous.x
  const deltaY = event.clientY - previous.y
  if (deltaX !== 0) {
    yawDegrees = (yawDegrees - deltaX * 0.33) % 360
    kernel.setViewYawDegrees(yawDegrees)
  }
  if (deltaY !== 0) {
    // The scene follows the finger: dragging down lifts the camera by the metres the drag covers at the character
    // (the square frame is as high as the canvas).
    const canvas = canvasRef.value
    const metresPerPixel = canvas != null && canvas.clientHeight > 0 && frameHeightAt != null
      ? frameHeightAt(zoom) / canvas.clientHeight
      : 0.002
    panBy(deltaY * metresPerPixel)
  }
}

function handlePointerUp(event: PointerEvent) {
  activePointers.delete(event.pointerId)
  pinchDistance = pointerDistance()
}

function handleWheel(event: WheelEvent) {
  if (!props.wheelZoom || status.value !== "ready" || kernel == null) {
    return
  }
  event.preventDefault()
  // Trackpads report small pixel deltas, mice ~100 per notch; normalise to a
  // smooth exponential so both feel alike.
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY
  zoomBy(Math.exp(-delta * 0.002))
}

/** Turn the view by `degrees` (the character stays put; the camera orbits). */
function rotateBy(degrees: number) {
  yawDegrees = (yawDegrees + degrees) % 360
  kernel?.setViewYawDegrees(yawDegrees)
}

function resetView() {
  yawDegrees = 0
  zoom = 1
  heightOffset = 0
  applyView()
}

/** The current view as a PNG, rendered at 2048 px high (sharp regardless of the canvas size); null while not ready. */
async function captureImage(): Promise<Blob | null> {
  if (status.value !== "ready" || kernel == null) {
    return null
  }
  return kernel.captureImage({ height: 2048 })
}

defineExpose({ rotateBy, zoomBy, resetView, captureImage })

function handleVisibilityChange() {
  if (kernel == null || status.value !== "ready") {
    return
  }
  if (document.hidden) {
    kernel.pause()
  } else {
    kernel.play()
  }
}

watch([() => props.recipe, contentBaseUrl], () => {
  void loadRecipe()
})

// The backdrop changes in place; the model stays loaded.
watch(() => props.background, (background) => {
  kernel?.setBackground(background).catch((error) => console.error("3D background:", error))
})

onMounted(() => {
  if (hostRef.value != null) {
    resizeObserver = new ResizeObserver(() => applySize())
    resizeObserver.observe(hostRef.value)
  }
  document.addEventListener("visibilitychange", handleVisibilityChange)
  void loadRecipe()
})

onBeforeUnmount(() => {
  endLoadProgress()
  loadGeneration += 1
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  resizeObserver?.disconnect()
  void disposeKernel()
})
</script>

<template>
  <div ref="hostRef" :class="cn('relative w-full overflow-hidden rounded-md border bg-[#1c1e2c]', props.class)">
    <canvas
      ref="canvasRef"
      class="block size-full touch-none cursor-grab active:cursor-grabbing"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      @wheel="handleWheel"
    />
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex items-center justify-center bg-black/30"
    >
      <div class="flex w-48 max-w-[70%] flex-col items-center gap-2" role="status" aria-live="polite">
        <LucideLoaderCircle class="size-8 animate-spin text-white/80" />
        <template v-if="loadProgress">
          <div
            class="h-1.5 w-full overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            :aria-valuenow="Math.round((loadProgress.fraction ?? 0) * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div class="h-full rounded-full bg-white/80 transition-[width]" :style="{ width: `${(loadProgress.fraction ?? 0) * 100}%` }" />
          </div>
          <p class="text-xs text-white/80 tabular-nums">
            {{
              t("costumes.viewer.loadingProgress", {
                done: loadProgress.done,
                total: loadProgress.requested,
                mb: formatMegabytes(loadProgress.bytesDone),
              })
            }}
          </p>
        </template>
        <p v-else class="text-xs text-white/80">{{ t("costumes.viewer.loadingPrepare") }}</p>
      </div>
    </div>
    <div
      v-else-if="status === 'error'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-4 text-center"
    >
      <p class="text-sm text-white/90">{{ t("costumes.viewer.loadError") }}</p>
      <p v-if="errorMessage" class="max-w-full truncate font-mono text-xs text-white/60" :title="errorMessage">
        {{ errorMessage }}
      </p>
      <Button variant="secondary" size="sm" @click="loadRecipe">
        <LucideRefreshCcw class="mr-1 size-4" /> {{ t("costumes.viewer.retry") }}
      </Button>
    </div>
    <div
      v-else-if="status === 'idle'"
      class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white/60"
    >
      {{ t("costumes.viewer.idle") }}
    </div>
  </div>
</template>
