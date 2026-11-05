<script setup lang="ts">
/**
 * Usage — one per page, it owns the page's heading:
 *   <PageHeader :title="t('x.title')" :description="t('x.description')" :back="{ name: 'x' }">
 *     <template #actions><Button …/></template>   (right-aligned, wraps under the title on phones)
 *   </PageHeader>
 * Props: title, description, eyebrow, back (route location or href) + backLabel, as ("h1" | "h2" | "h3",
 * default "h1"), size ("default" | "compact" for dialog-like pages). Slots: actions, badge (inline after the
 * title), default (extra meta under the description). Keep the editorial header of the legal pages as is.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, type RouteLocationRaw } from "vue-router"
import { LucideArrowLeft } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  title: string
  description?: string | null
  /** Small label above the title (a section or product name). */
  eyebrow?: string | null
  /** Where the back link goes: a router location, or an absolute URL for an `<a>`. */
  back?: RouteLocationRaw | null
  backLabel?: string | null
  /** Heading level; the page's main header is an h1. */
  as?: "h1" | "h2" | "h3"
  /** `compact` is for dialog-like pages (settings columns) with a smaller title. */
  size?: "default" | "compact"
  class?: string
}>(), {
  description: null,
  eyebrow: null,
  back: null,
  backLabel: null,
  as: "h1",
  size: "default",
  class: undefined,
})

const { t } = useI18n()

const compact = computed(() => props.size === "compact")
const externalBack = computed(() => typeof props.back === "string" && /^(?:https?:)?\/\//.test(props.back))
</script>

<template>
  <header
    data-slot="page-header"
    :class="cn('flex flex-col sm:flex-row sm:items-end sm:justify-between', compact ? 'gap-2' : 'gap-3', props.class)"
  >
    <div class="min-w-0">
      <Button v-if="back" as-child variant="ghost" size="sm" class="-ml-2 mb-1 h-8 gap-1 px-2">
        <a v-if="externalBack" :href="back as string">
          <LucideArrowLeft class="size-4" aria-hidden="true" />
          {{ backLabel ?? t("common.back") }}
        </a>
        <RouterLink v-else :to="back">
          <LucideArrowLeft class="size-4" aria-hidden="true" />
          {{ backLabel ?? t("common.back") }}
        </RouterLink>
      </Button>
      <p v-if="eyebrow" class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ eyebrow }}</p>
      <component
        :is="as"
        :class="[
          compact ? 'text-lg font-semibold tracking-tight' : 'text-2xl font-bold tracking-tight',
          $slots.badge ? 'flex min-w-0 flex-wrap items-center gap-2' : '',
        ]"
      >
        {{ title }}
        <slot name="badge" />
      </component>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
