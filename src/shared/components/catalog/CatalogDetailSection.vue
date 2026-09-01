<script setup lang="ts">
import type { Component } from "vue"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * One titled block on a detail page. `empty` swaps the body for a short
 * muted message; `loading` shows the skeleton slot (or a default bar).
 */
const props = withDefaults(defineProps<{
  title: string
  icon?: Component
  description?: string | null
  loading?: boolean
  empty?: boolean
  emptyMessage?: string | null
  contentClass?: string
  class?: string
}>(), {
  icon: undefined,
  description: null,
  loading: false,
  empty: false,
  emptyMessage: null,
  contentClass: undefined,
  class: undefined,
})
</script>

<template>
  <Card :class="cn('gap-4', props.class)" data-slot="catalog-detail-section">
    <CardHeader class="pb-0">
      <CardTitle class="flex flex-wrap items-center gap-2 text-base">
        <component :is="icon" v-if="icon" class="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span class="min-w-0 flex-1">{{ title }}</span>
        <slot name="action" />
      </CardTitle>
      <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
    </CardHeader>
    <CardContent :class="contentClass">
      <template v-if="loading">
        <slot name="skeleton">
          <div class="flex flex-col gap-2">
            <Skeleton class="h-4 w-2/3" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-16 w-full" />
          </div>
        </slot>
      </template>
      <p v-else-if="empty" class="text-sm text-muted-foreground">{{ emptyMessage }}</p>
      <slot v-else />
    </CardContent>
  </Card>
</template>
