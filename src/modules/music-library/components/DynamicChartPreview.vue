<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Pause, Play } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { holdEdgesAtTime, type ChartVisHold, type ChartVisTap, type DynamicChart } from "../lib/chart-dynamic"

const props = defineProps<{
  chart: DynamicChart
  audioUrl: string | null
  fillerSec: number
}>()

const { t } = useI18n()

const LANES = 12
const NOTE_HEIGHT = 11
const TRAIL_SECONDS = 0.35

const COLORS = {
  laneBg: "#101322",
  laneLine: "rgba(255, 255, 255, 0.09)",
  barLine: "rgba(255, 255, 255, 0.18)",
  judge: "#e2467d",
  tap: "#4ec3f7",
  critical: "#ffd54a",
  flick: "#f56aa4",
  damage: "#8e7cc3",
  trace: "rgba(255, 235, 130, 0.9)",
  hold: "rgba(112, 230, 170, 0.32)",
  holdCritical: "rgba(255, 213, 74, 0.32)",
  holdHead: "#59d99d",
  tick: "#a4ecc8",
  text: "rgba(255, 255, 255, 0.65)",
} as const

const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const playing = ref(false)
const currentTime = ref(0)

/** In-game note speed setting (1.0–12.0, 0.1 steps). */
const noteSpeed = ref(10.5)
const NOTE_SPEED_MIN = 1
const NOTE_SPEED_MAX = 12

/**
 * In-game fall duration curve: speed 12 → 0.35 s, speed 1 → 4.0 s, eased
 * with a 1.31 power (matches the game's note-speed setting behavior).
 */
function noteFallDuration(speed: number): number {
  const clamped = Math.min(NOTE_SPEED_MAX, Math.max(NOTE_SPEED_MIN, speed))
  const eased = Math.pow((NOTE_SPEED_MAX - clamped) / (NOTE_SPEED_MAX - NOTE_SPEED_MIN), 1.31)
  return 0.35 + (4.0 - 0.35) * eased
}

function adjustNoteSpeed(delta: number) {
  const next = Math.round((noteSpeed.value + delta) * 10) / 10
  noteSpeed.value = Math.min(NOTE_SPEED_MAX, Math.max(NOTE_SPEED_MIN, next))
}

const noteSpeedLabel = computed(() => noteSpeed.value.toFixed(1))

const totalDuration = computed(() => props.chart.duration + 1.5)

let audio: HTMLAudioElement | null = null
let rafHandle = 0
/** performance.now() based clock origin for silent (no audio) playback. */
let silentClockOrigin: number | null = null

function ensureAudio(): HTMLAudioElement | null {
  if (props.audioUrl == null) {
    return null
  }
  if (!audio || audio.src !== props.audioUrl) {
    disposeAudio()
    audio = new Audio(props.audioUrl)
    audio.preload = "auto"
    audio.addEventListener("ended", stop)
  }

  return audio
}

function disposeAudio() {
  if (audio) {
    audio.pause()
    audio.src = ""
    audio = null
  }
}

function play() {
  const element = ensureAudio()
  playing.value = true
  if (element) {
    element.currentTime = currentTime.value + props.fillerSec
    void element.play().catch(() => {
      // Fall back to the silent clock when playback is blocked.
      silentClockOrigin = performance.now() - currentTime.value * 1000
    })
  } else {
    silentClockOrigin = performance.now() - currentTime.value * 1000
  }
  scheduleFrame()
}

function stop() {
  playing.value = false
  silentClockOrigin = null
  audio?.pause()
  draw()
}

function togglePlayback() {
  if (playing.value) {
    stop()
  } else {
    if (currentTime.value >= totalDuration.value - 0.05) {
      currentTime.value = 0
    }
    play()
  }
}

function seekTo(value: number) {
  currentTime.value = Math.min(Math.max(0, value), totalDuration.value)
  if (audio && props.audioUrl != null) {
    audio.currentTime = currentTime.value + props.fillerSec
  }
  if (silentClockOrigin != null) {
    silentClockOrigin = performance.now() - currentTime.value * 1000
  }
  if (!playing.value) {
    draw()
  }
}

function handleSeekInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) {
    seekTo(value)
  }
}

function scheduleFrame() {
  cancelAnimationFrame(rafHandle)
  rafHandle = requestAnimationFrame(tick)
}

function tick() {
  if (!playing.value) {
    return
  }

  if (audio && !audio.paused) {
    currentTime.value = audio.currentTime - props.fillerSec
  } else if (silentClockOrigin != null) {
    currentTime.value = (performance.now() - silentClockOrigin) / 1000
  }

  if (currentTime.value >= totalDuration.value) {
    currentTime.value = totalDuration.value
    stop()
    return
  }

  draw()
  scheduleFrame()
}

function laneGeometry(canvasWidth: number) {
  const areaWidth = Math.min(canvasWidth - 24, 430)
  const left = (canvasWidth - areaWidth) / 2
  return { left, laneWidth: areaWidth / LANES, areaWidth }
}

function drawFlickArrow(
  context: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  width: number,
  direction: "up" | "left" | "right" | "down",
  color: string,
) {
  const size = Math.min(width * 0.4, 14)
  context.save()
  context.translate(centerX, topY - size * 0.8)
  if (direction === "left") {
    context.rotate(-0.5)
  } else if (direction === "right") {
    context.rotate(0.5)
  } else if (direction === "down") {
    context.rotate(Math.PI)
  }
  context.beginPath()
  context.moveTo(0, -size * 0.7)
  context.lineTo(-size * 0.62, size * 0.35)
  context.lineTo(size * 0.62, size * 0.35)
  context.closePath()
  context.fillStyle = color
  context.fill()
  context.restore()
}

function drawTap(
  context: CanvasRenderingContext2D,
  tap: ChartVisTap,
  x: number,
  y: number,
  width: number,
) {
  const color = tap.damage
    ? COLORS.damage
    : tap.flick != null
      ? COLORS.flick
      : tap.critical
        ? COLORS.critical
        : COLORS.tap

  context.beginPath()
  context.roundRect(x + 1.5, y - NOTE_HEIGHT / 2, width - 3, NOTE_HEIGHT, 5)
  if (tap.trace) {
    context.strokeStyle = COLORS.trace
    context.lineWidth = 2
    context.stroke()
  } else {
    context.fillStyle = color
    context.fill()
    context.strokeStyle = "rgba(255,255,255,0.55)"
    context.lineWidth = 1
    context.stroke()
  }

  if (tap.flick != null) {
    drawFlickArrow(context, x + width / 2, y - NOTE_HEIGHT / 2, width, tap.flick, COLORS.flick)
  }
}

function drawHold(
  context: CanvasRenderingContext2D,
  hold: ChartVisHold,
  geometry: { left: number; laneWidth: number },
  timeToY: (time: number) => number,
  windowStart: number,
  windowEnd: number,
) {
  const points = hold.points
  const first = points[0]
  const last = points[points.length - 1]
  if (last.time < windowStart || first.time > windowEnd) {
    return
  }

  // Body polygon: down the left edges, back up the right edges. Sample the
  // clipped window bounds so partially visible holds still render.
  const sampleTimes: number[] = []
  const start = Math.max(first.time, windowStart)
  const end = Math.min(last.time, windowEnd)
  sampleTimes.push(start)
  for (const point of points) {
    if (point.time > start && point.time < end) {
      sampleTimes.push(point.time)
    }
  }
  sampleTimes.push(end)

  const edges = sampleTimes
    .map((time) => ({ time, edge: holdEdgesAtTime(hold, time) }))
    .filter((entry): entry is { time: number; edge: { left: number; right: number } } => entry.edge != null)
  if (edges.length < 2) {
    return
  }

  context.beginPath()
  for (let index = 0; index < edges.length; index += 1) {
    const { time, edge } = edges[index]
    const x = geometry.left + edge.left * geometry.laneWidth + 1.5
    const y = timeToY(time)
    if (index === 0) {
      context.moveTo(x, y)
    } else {
      context.lineTo(x, y)
    }
  }
  for (let index = edges.length - 1; index >= 0; index -= 1) {
    const { time, edge } = edges[index]
    context.lineTo(geometry.left + edge.right * geometry.laneWidth - 1.5, timeToY(time))
  }
  context.closePath()
  context.fillStyle = hold.critical ? COLORS.holdCritical : COLORS.hold
  context.fill()

  // Relay ticks.
  for (const point of points) {
    if (!point.tick || point.time < windowStart || point.time > windowEnd) {
      continue
    }
    const centerX = geometry.left + (point.lane + point.width / 2) * geometry.laneWidth
    const y = timeToY(point.time)
    context.beginPath()
    context.moveTo(centerX, y - 5)
    context.lineTo(centerX + 5, y)
    context.lineTo(centerX, y + 5)
    context.lineTo(centerX - 5, y)
    context.closePath()
    context.fillStyle = hold.critical ? COLORS.critical : COLORS.tick
    context.fill()
  }

  // Head / end note bars.
  const headColor = hold.critical ? COLORS.critical : COLORS.holdHead
  for (const [point, visible] of [[first, hold.startVisible], [last, hold.endVisible]] as const) {
    if (!visible || point.time < windowStart || point.time > windowEnd) {
      continue
    }
    const x = geometry.left + point.lane * geometry.laneWidth
    const width = point.width * geometry.laneWidth
    const y = timeToY(point.time)
    context.beginPath()
    context.roundRect(x + 1.5, y - NOTE_HEIGHT / 2, width - 3, NOTE_HEIGHT, 5)
    context.fillStyle = point === last && hold.endFlick != null ? COLORS.flick : headColor
    context.fill()
    context.strokeStyle = "rgba(255,255,255,0.55)"
    context.lineWidth = 1
    context.stroke()
    if (point === last && hold.endFlick != null) {
      drawFlickArrow(context, x + width / 2, y - NOTE_HEIGHT / 2, width, hold.endFlick, COLORS.flick)
    }
  }
}

function draw() {
  const canvas = canvasRef.value
  const wrapper = wrapperRef.value
  if (!canvas || !wrapper) {
    return
  }

  const cssWidth = wrapper.clientWidth
  const cssHeight = Math.min(560, Math.max(380, Math.round(cssWidth * 1.05)))
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    canvas.style.height = `${cssHeight}px`
  }

  const context = canvas.getContext("2d")
  if (!context) {
    return
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, cssWidth, cssHeight)

  const geometry = laneGeometry(cssWidth)
  const judgeY = cssHeight - 36
  const now = currentTime.value
  // Notes travel from the top edge to the judge line in the in-game fall time.
  const speed = judgeY / noteFallDuration(noteSpeed.value)
  const windowStart = now - TRAIL_SECONDS
  const windowEnd = now + (judgeY + 30) / speed
  const timeToY = (time: number) => judgeY - (time - now) * speed

  // Lane background and separators.
  context.fillStyle = COLORS.laneBg
  context.fillRect(geometry.left, 0, geometry.areaWidth, cssHeight)
  context.lineWidth = 1
  for (let lane = 0; lane <= LANES; lane += 1) {
    const x = geometry.left + lane * geometry.laneWidth
    context.strokeStyle = COLORS.laneLine
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, cssHeight)
    context.stroke()
  }

  // Bar lines.
  context.fillStyle = COLORS.text
  context.font = "10px ui-monospace, monospace"
  for (const barLine of props.chart.barLines) {
    if (barLine.time < windowStart || barLine.time > windowEnd) {
      continue
    }
    const y = timeToY(barLine.time)
    context.strokeStyle = COLORS.barLine
    context.beginPath()
    context.moveTo(geometry.left, y)
    context.lineTo(geometry.left + geometry.areaWidth, y)
    context.stroke()
    context.fillText(String(barLine.bar), geometry.left + geometry.areaWidth + 6, y + 3)
  }

  // Judge line.
  context.strokeStyle = COLORS.judge
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(geometry.left - 6, judgeY)
  context.lineTo(geometry.left + geometry.areaWidth + 6, judgeY)
  context.stroke()

  for (const hold of props.chart.holds) {
    drawHold(context, hold, geometry, timeToY, windowStart, windowEnd)
  }

  for (const tap of props.chart.taps) {
    if (tap.time < windowStart || tap.time > windowEnd) {
      continue
    }
    drawTap(
      context,
      tap,
      geometry.left + tap.lane * geometry.laneWidth,
      timeToY(tap.time),
      tap.width * geometry.laneWidth,
    )
  }
}

function formatClock(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const minutes = Math.floor(clamped / 60)
  const secs = Math.floor(clamped % 60)
  return `${minutes}:${String(secs).padStart(2, "0")}`
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  draw()
  if (wrapperRef.value != null) {
    resizeObserver = new ResizeObserver(() => draw())
    resizeObserver.observe(wrapperRef.value)
  }
})

watch(() => props.chart, () => {
  stop()
  currentTime.value = 0
  draw()
})

watch([noteSpeed], () => {
  draw()
})

watch(() => props.audioUrl, () => {
  const wasPlaying = playing.value
  stop()
  disposeAudio()
  if (wasPlaying) {
    play()
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafHandle)
  disposeAudio()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" class="h-8 gap-1 px-3" @click="togglePlayback">
        <component :is="playing ? Pause : Play" class="size-4" />
        {{ playing ? t("musicLibrary.detail.pause") : t("musicLibrary.detail.play") }}
      </Button>
      <span class="text-xs tabular-nums text-muted-foreground">
        {{ formatClock(currentTime) }} / {{ formatClock(totalDuration) }}
      </span>
      <input
        type="range"
        class="min-w-32 flex-1 accent-primary"
        :min="0"
        :max="totalDuration"
        :step="0.1"
        :value="currentTime"
        :aria-label="t('musicLibrary.detail.chartPreview.seek')"
        @input="handleSeekInput"
      >
      <span class="inline-flex items-center gap-1" :aria-label="t('musicLibrary.detail.chartPreview.speed')">
        <span class="text-xs text-muted-foreground">{{ t("musicLibrary.detail.chartPreview.speed") }}</span>
        <Button variant="outline" size="sm" class="h-7 px-1.5 text-xs" :disabled="noteSpeed <= NOTE_SPEED_MIN" @click="adjustNoteSpeed(-1)">-1</Button>
        <Button variant="outline" size="sm" class="h-7 px-1.5 text-xs" :disabled="noteSpeed <= NOTE_SPEED_MIN" @click="adjustNoteSpeed(-0.1)">-0.1</Button>
        <span class="w-9 text-center text-sm font-semibold tabular-nums">{{ noteSpeedLabel }}</span>
        <Button variant="outline" size="sm" class="h-7 px-1.5 text-xs" :disabled="noteSpeed >= NOTE_SPEED_MAX" @click="adjustNoteSpeed(0.1)">+0.1</Button>
        <Button variant="outline" size="sm" class="h-7 px-1.5 text-xs" :disabled="noteSpeed >= NOTE_SPEED_MAX" @click="adjustNoteSpeed(1)">+1</Button>
      </span>
    </div>
    <p v-if="audioUrl == null" class="text-xs text-muted-foreground">
      {{ t("musicLibrary.detail.chartPreview.silent") }}
    </p>
    <div ref="wrapperRef" class="overflow-hidden rounded-md border bg-[#0b0d18]">
      <canvas ref="canvasRef" class="block w-full" />
    </div>
  </div>
</template>
