<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDown } from "lucide-vue-next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * One titled block on a detail page. `empty` swaps the body for a short
 * muted message; `loading` shows the skeleton slot (or a default bar).
 * `collapsible` sections render only their header until opened and emit
 * `open` the first time — heavy/lazy content (ranking rewards, gacha pool,
 * exchange tables) loads on that event, never on mount.
 */
const props = withDefaults(defineProps<{
  title: string
  icon?: Component
  description?: string | null
  loading?: boolean
  empty?: boolean
  emptyMessage?: string | null
  collapsible?: boolean
  defaultOpen?: boolean
  contentClass?: string
  class?: string
}>(), {
  icon: undefined,
  description: null,
  loading: false,
  empty: false,
  emptyMessage: null,
  collapsible: false,
  defaultOpen: true,
  contentClass: undefined,
  class: undefined,
})

const emit = defineEmits<{
  open: []
  toggle: [open: boolean]
}>()

const { t } = useI18n()

const open = ref(props.collapsible ? props.defaultOpen : true)
let opened = open.value

const bodyVisible = computed(() => !props.collapsible || open.value)

function toggle() {
  if (!props.collapsible) {
    return
  }
  open.value = !open.value
  emit("toggle", open.value)
}

watch(open, (value) => {
  if (value && !opened) {
    opened = true
    emit("open")
  }
}, { immediate: true })

defineExpose({ open: () => { open.value = true } })
</script>

<template>
  <Card :class="cn('gap-4', !bodyVisible ? 'gap-0 py-4' : '', props.class)" data-slot="catalog-detail-section">
    <CardHeader :class="bodyVisible ? 'pb-0' : 'pb-0'">
      <CardTitle class="flex flex-wrap items-center gap-2 text-base">
        <component :is="icon" v-if="icon" class="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <button
          v-if="collapsible"
          type="button"
          class="flex min-w-0 flex-1 items-center gap-2 text-left"
          :aria-expanded="open"
          @click="toggle"
        >
          <span class="min-w-0 flex-1 truncate">{{ title }}</span>
          <span v-if="!open && $slots.summary" class="min-w-0 max-w-[45%] truncate text-xs font-normal text-muted-foreground">
            <slot name="summary" />
          </span>
          <ChevronDown
            class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
            :class="open ? '' : '-rotate-90'"
            aria-hidden="true"
          />
          <span class="sr-only">{{ open ? t("catalog.detail.showLess") : t("catalog.detail.showMore") }}</span>
        </button>
        <span v-else class="min-w-0 flex-1">{{ title }}</span>
        <slot name="action" />
      </CardTitle>
      <p v-if="description && bodyVisible" class="text-xs text-muted-foreground">{{ description }}</p>
    </CardHeader>
    <CardContent v-if="bodyVisible" :class="contentClass">
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
