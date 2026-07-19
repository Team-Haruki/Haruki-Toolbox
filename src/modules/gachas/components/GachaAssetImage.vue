<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { LucideImageOff } from "lucide-vue-next"

const props = withDefaults(defineProps<{
  /** Ordered URL candidates; advances to the next one on image error. */
  sources: string[]
  alt: string
  fit?: "contain" | "cover"
}>(), {
  fit: "contain",
})

const sourceIndex = ref(0)

watch(() => props.sources, () => {
  sourceIndex.value = 0
})

const currentUrl = computed(() => props.sources[sourceIndex.value] ?? null)

function handleError() {
  sourceIndex.value += 1
}
</script>

<template>
  <img
    v-if="currentUrl"
    :src="currentUrl"
    :alt="alt"
    :class="['h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain']"
    loading="lazy"
    @error="handleError"
  >
  <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
    <LucideImageOff class="h-6 w-6" aria-hidden="true" />
  </div>
</template>
