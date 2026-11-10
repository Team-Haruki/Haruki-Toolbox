<script setup lang="ts">
import type { Component } from "vue"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"

/**
 * One block of the user detail page that loads from its own endpoint: an
 * `AdminPanel` whose body is a skeleton while the first answer is pending, a
 * retryable error when the load failed, an empty state when there is nothing,
 * and the default slot (a divided list) otherwise.
 *
 * Slots: default, `actions` (right of the title), `empty-action` (a button
 * under the empty text).
 */
withDefaults(defineProps<{
  title: string
  description?: string
  loading: boolean
  /** A failed load, shown in place of the list with a retry. */
  error?: ErrorDescription | null
  errorTitle?: string
  /** Nothing to list. */
  empty: boolean
  emptyText: string
  emptyIcon?: Component
  /** Skeleton lines while loading. */
  skeletonRows?: number
}>(), {
  description: undefined,
  error: null,
  errorTitle: undefined,
  emptyIcon: undefined,
  skeletonRows: 2,
})

const emit = defineEmits<{ (e: "retry"): void }>()
</script>

<template>
  <AdminPanel :title="title" :description="description" flush>
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <!-- A reload with rows on screen keeps them; only an empty block shows the skeleton. -->
    <div v-if="loading && empty" class="divide-y divide-border/60" aria-hidden="true">
      <div v-for="index in skeletonRows" :key="index" class="flex items-center gap-3 px-4 py-3">
        <Skeleton class="size-8 shrink-0 rounded-lg" />
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton class="h-4 w-40 max-w-full" />
          <Skeleton class="h-3 w-56 max-w-full" />
        </div>
      </div>
    </div>
    <LoadErrorState
      v-else-if="error"
      class="px-4 py-8"
      :title="errorTitle"
      :description="error.message"
      :detail="error.detail"
      :retrying="loading"
      @retry="emit('retry')"
    />
    <div v-else-if="empty" class="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <component :is="emptyIcon" v-if="emptyIcon" class="size-7 text-muted-foreground/60" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ emptyText }}</p>
      <slot name="empty-action" />
    </div>
    <slot v-else />
  </AdminPanel>
</template>
