<script setup lang="ts">
import type { Component } from "vue"
import { LucideSearchX } from "lucide-vue-next"
import { Card, CardContent } from "@/components/ui/card"

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
    <CardContent class="flex flex-col items-center gap-3 py-12 text-center">
      <component :is="icon ?? LucideSearchX" class="size-8 text-muted-foreground/60" aria-hidden="true" />
      <div class="space-y-1">
        <p class="text-sm text-muted-foreground">{{ message }}</p>
        <p v-if="hint" class="text-xs text-muted-foreground/80">{{ hint }}</p>
      </div>
      <slot name="action" />
    </CardContent>
  </Card>
</template>
