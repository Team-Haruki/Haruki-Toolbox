<script setup lang="ts">
/**
 * A panel-filling state of an OAuth2 flow page: what happened, what to do
 * next, and the buttons for it (default slot). `tone="error"` is the shared
 * `LoadErrorState`; the other tones keep its geometry with their own icon.
 */
import type { Component } from "vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"

export type OAuthFlowStateTone = "success" | "attention" | "neutral" | "error"

withDefaults(defineProps<{
  tone?: OAuthFlowStateTone
  /** Lucide component; unused for `tone="error"`. */
  icon?: Component
  title: string
  description?: string | null
}>(), {
  tone: "neutral",
  icon: undefined,
  description: null,
})

const ICON_TONE: Record<Exclude<OAuthFlowStateTone, "error">, string> = {
  success: "text-primary",
  attention: "text-amber-600 dark:text-amber-400",
  neutral: "text-muted-foreground/60",
}
</script>

<template>
  <div class="flex min-w-0 flex-col px-4" data-slot="oauth-flow-state">
    <!-- Both properties are inherited: inside LoadErrorState a long backend
         message wraps, and its "Details: …" line keeps its own line. -->
    <div v-if="tone === 'error'" class="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">
      <LoadErrorState :title="title" :description="description" :retryable="false" />
    </div>
    <div v-else class="flex flex-col items-center gap-3 py-10 text-center [overflow-wrap:anywhere]" role="status">
      <component :is="icon" v-if="icon" :class="['size-8', ICON_TONE[tone]]" aria-hidden="true" />
      <div class="space-y-1">
        <p class="text-sm font-medium">{{ title }}</p>
        <p v-if="description" class="max-w-md text-sm text-muted-foreground">{{ description }}</p>
      </div>
    </div>
    <!-- Full-width and stacked on a phone, side by side and centred once two buttons fit. -->
    <div v-if="$slots.default" class="-mt-5 flex flex-col gap-2 pb-8 @min-[26rem]:flex-row @min-[26rem]:justify-center">
      <slot />
    </div>
  </div>
</template>
