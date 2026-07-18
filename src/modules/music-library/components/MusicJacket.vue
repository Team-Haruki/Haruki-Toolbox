<script setup lang="ts">
import { ref, watch } from "vue"
import { Music } from "lucide-vue-next"

const props = defineProps<{
  url: string | null
  alt: string
}>()

const failed = ref(false)

watch(
  () => props.url,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <div class="relative overflow-hidden bg-muted">
    <img
      v-if="props.url && !failed"
      :src="props.url"
      :alt="props.alt"
      loading="lazy"
      class="size-full object-cover"
      @error="failed = true"
    >
    <div v-else class="flex size-full items-center justify-center text-muted-foreground">
      <Music class="size-1/3 min-h-6 min-w-6 max-h-12 max-w-12" />
    </div>
  </div>
</template>
