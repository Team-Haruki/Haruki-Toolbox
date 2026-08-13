<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoaderCircle, LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { resolvePjsk3dRuntimeBaseUrl } from "@/shared/sekai/data-sources"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { Haruki3DKernel } from "../vendor/haruki-3d-engine/haruki-3d-engine.js"

export type CostumeViewerRecipe = {
  characterId: number
  unit: string
  bodyCostume3dId: number
  headCostume3dId: number
  hairCostume3dId: number
}

const props = defineProps<{
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  recipe: CostumeViewerRecipe | null
}>()

const { t } = useI18n()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLDivElement | null>(null)
const status = ref<"idle" | "loading" | "ready" | "error">("idle")
const errorMessage = ref<string | null>(null)

const assetBaseUrl = computed(() => resolvePjsk3dRuntimeBaseUrl(props.region, props.preference))

let kernel: Haruki3DKernel | null = null
let kernelBaseUrl: string | null = null
let resizeObserver: ResizeObserver | null = null
let loadGeneration = 0

async function ensureKernel(): Promise<Haruki3DKernel | null> {
  const canvas = canvasRef.value
  if (canvas == null) {
    return null
  }

  if (kernel != null && kernelBaseUrl === assetBaseUrl.value) {
    return kernel
  }

  await disposeKernel()
  // The engine bundle (~450 kB + wasm) is loaded on demand.
  const engine = await import("../vendor/haruki-3d-engine/haruki-3d-engine.js")
  kernel = engine.createHaruki3DKernel({
    canvas,
    assetBaseUrl: assetBaseUrl.value,
  })
  kernelBaseUrl = assetBaseUrl.value
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
  const host = hostRef.value
  if (host != null && kernel != null) {
    const { width, height } = host.getBoundingClientRect()
    if (width > 0 && height > 0) {
      // The engine multiplies by min(devicePixelRatio, 2). Supersample on
      // low-DPR displays so the backing store always ends up ~2x the CSS
      // size — at 1x the world-space toon outlines alias into heavy edges
      // (the capture service renders at scale 2 for the same reason).
      const superSample = Math.max(1, Math.min(2, 2 / (window.devicePixelRatio || 1)))
      kernel.resize(width * superSample, height * superSample)
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
  try {
    const activeKernel = await ensureKernel()
    if (activeKernel == null || generation !== loadGeneration) {
      return
    }

    await activeKernel.load({
      roleId: `${recipe.characterId}:${recipe.unit}`,
      bodyCostume3dId: recipe.bodyCostume3dId,
      headCostume3dId: recipe.headCostume3dId,
      hairCostume3dId: recipe.hairCostume3dId,
      headOptionalCostume3dId: null,
    })
    if (generation !== loadGeneration) {
      return
    }

    // Loading resets CameraRoot; restore the user's view without moving the model.
    activeKernel.setViewYawDegrees(yawDegrees)
    activeKernel.play()
    status.value = "ready"
  } catch (loadError) {
    if (generation === loadGeneration) {
      errorMessage.value = loadError instanceof Error ? loadError.message : String(loadError)
      status.value = "error"
    }
  }
}

// --- Drag to rotate ---------------------------------------------------------

let yawDegrees = 0
let dragPointerId: number | null = null
let dragLastX = 0

function handlePointerDown(event: PointerEvent) {
  if (status.value !== "ready" || kernel == null) {
    return
  }
  dragPointerId = event.pointerId
  dragLastX = event.clientX
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (dragPointerId !== event.pointerId || kernel == null) {
    return
  }
  const deltaX = event.clientX - dragLastX
  dragLastX = event.clientX
  yawDegrees = (yawDegrees + deltaX * 0.33) % 360
  kernel.setViewYawDegrees(yawDegrees)
}

function handlePointerUp(event: PointerEvent) {
  if (dragPointerId === event.pointerId) {
    dragPointerId = null
  }
}

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

watch([() => props.recipe, assetBaseUrl], () => {
  void loadRecipe()
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
  loadGeneration += 1
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  resizeObserver?.disconnect()
  void disposeKernel()
})
</script>

<template>
  <div ref="hostRef" class="relative aspect-[7/5] w-full overflow-hidden rounded-md border bg-[#1c1e2c]">
    <canvas
      ref="canvasRef"
      class="block size-full touch-none cursor-grab active:cursor-grabbing"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    />
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex items-center justify-center bg-black/30"
    >
      <LucideLoaderCircle class="size-8 animate-spin text-white/80" />
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
