<script setup lang="ts">
import { computed } from "vue"

export type ProfileRadarEntry = {
  key: string | number
  label: string
  value: number
  /** Tooltip line shown after the label, e.g. a formatted value. */
  detail?: string
  iconUrl?: string | null
  color?: string | null
}

const props = withDefaults(defineProps<{
  entries: ProfileRadarEntry[]
  /** Chart maximum; defaults to the largest entry value. */
  max?: number | null
  size?: number
  levels?: number
}>(), {
  max: null,
  size: 360,
  levels: 4,
})

const ICON_SIZE = 20
const LABEL_MARGIN = 30

const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - LABEL_MARGIN)

const effectiveMax = computed(() => {
  if (props.max != null && props.max > 0) {
    return props.max
  }

  const maxValue = Math.max(0, ...props.entries.map((entry) => entry.value))
  return maxValue > 0 ? maxValue : 1
})

function pointAt(index: number, distance: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / Math.max(1, props.entries.length)
  return {
    x: center.value + distance * Math.cos(angle),
    y: center.value + distance * Math.sin(angle),
  }
}

function toPolygonPoints(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")
}

const ringPolygons = computed(() => Array.from({ length: props.levels }, (_, level) => {
  const ringRadius = (radius.value * (level + 1)) / props.levels
  return toPolygonPoints(props.entries.map((_, index) => pointAt(index, ringRadius)))
}))

const axisEnds = computed(() => props.entries.map((_, index) => pointAt(index, radius.value)))

const valueVertices = computed(() => props.entries.map((entry, index) => {
  const ratio = Math.min(1, Math.max(0, entry.value / effectiveMax.value))
  return { entry, point: pointAt(index, radius.value * ratio) }
}))

const valuePolygon = computed(() => toPolygonPoints(valueVertices.value.map((vertex) => vertex.point)))

const iconPositions = computed(() => props.entries.map((entry, index) => {
  const point = pointAt(index, radius.value + LABEL_MARGIN / 2 + 1)
  return { entry, x: point.x - ICON_SIZE / 2, y: point.y - ICON_SIZE / 2 }
}))
</script>

<template>
  <svg
    v-if="entries.length >= 3"
    :viewBox="`0 0 ${size} ${size}`"
    class="mx-auto w-full max-w-md"
    role="img"
  >
    <polygon
      v-for="(ring, index) in ringPolygons"
      :key="index"
      :points="ring"
      fill="none"
      class="stroke-border"
      stroke-width="1"
    />
    <line
      v-for="(end, index) in axisEnds"
      :key="index"
      :x1="center"
      :y1="center"
      :x2="end.x"
      :y2="end.y"
      class="stroke-border/60"
      stroke-width="1"
    />
    <polygon
      :points="valuePolygon"
      class="fill-primary/25 stroke-primary"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <g v-for="vertex in valueVertices" :key="vertex.entry.key">
      <circle
        :cx="vertex.point.x"
        :cy="vertex.point.y"
        r="2.5"
        :fill="vertex.entry.color ?? 'currentColor'"
        class="text-primary"
      >
        <title>{{ vertex.entry.label }}{{ vertex.entry.detail ? `: ${vertex.entry.detail}` : "" }}</title>
      </circle>
    </g>
    <g v-for="item in iconPositions" :key="item.entry.key">
      <image
        v-if="item.entry.iconUrl"
        :href="item.entry.iconUrl"
        :x="item.x"
        :y="item.y"
        :width="ICON_SIZE"
        :height="ICON_SIZE"
      >
        <title>{{ item.entry.label }}{{ item.entry.detail ? `: ${item.entry.detail}` : "" }}</title>
      </image>
      <text
        v-else
        :x="item.x + ICON_SIZE / 2"
        :y="item.y + ICON_SIZE / 2"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-muted-foreground text-[9px]"
      >
        {{ item.entry.label.slice(0, 2) }}
      </text>
    </g>
  </svg>
</template>
