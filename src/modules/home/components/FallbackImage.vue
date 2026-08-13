<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { LucideImageOff } from "lucide-vue-next"

const props = withDefaults(defineProps<{
  /** Ordered candidate URLs; the next one is tried when the current fails. */
  candidates: readonly string[]
  alt: string
  imgClass?: string
}>(), {
  imgClass: "h-full w-full object-cover",
})

const index = ref(0)
watch(
  () => props.candidates,
  () => {
    index.value = 0
  },
)

const currentUrl = computed(() => props.candidates[index.value] ?? null)

function handleError() {
  index.value += 1
}
</script>

<template>
  <img
    decoding="async"
    v-if="currentUrl"
    :src="currentUrl"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    @error="handleError"
  >
  <div v-else class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
    <LucideImageOff class="h-4 w-4" aria-hidden="true" />
  </div>
</template>
