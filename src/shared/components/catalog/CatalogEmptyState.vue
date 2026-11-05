<script setup lang="ts">
import type { Component } from "vue"
import { LucideSearchX } from "lucide-vue-next"
import { Card, CardContent } from "@/components/ui/card"
import EmptyState from "@/shared/components/EmptyState.vue"

/** `EmptyState` in a Card, with a "no results" icon, for catalog lists and detail pages. */
withDefaults(defineProps<{
  message: string
  hint?: string | null
  icon?: Component
}>(), {
  hint: null,
  icon: undefined,
})
</script>

<template>
  <Card data-slot="catalog-empty-state">
    <CardContent>
      <EmptyState :title="message" :description="hint" :icon="icon ?? LucideSearchX">
        <template #action>
          <slot name="action" />
        </template>
      </EmptyState>
    </CardContent>
  </Card>
</template>
