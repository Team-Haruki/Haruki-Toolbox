<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChevronDown } from "lucide-vue-next"
import CardBoxCardGrid from "@/modules/cards/components/CardBoxCardGrid.vue"
import type { CardBoxCardView } from "@/modules/cards/lib/card-box"

/**
 * One collapsible group (a character or an attribute). The header sticks
 * under the roster strip while its grid scrolls, and the section skips
 * layout work while off-screen, which keeps a 1,400-card page responsive.
 */
const props = defineProps<{
  id: string
  name: string
  iconUrl: string | null
  color: string | null
  owned: number
  total: number
  percent: number
  views: readonly CardBoxCardView[]
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

/**
 * Placeholder height while the section is skipped off-screen (`auto` keeps
 * the real size once rendered). Assumes the widest grid; narrower screens
 * over-estimate, which only costs scrollbar accuracy, never layout.
 */
const intrinsicSize = computed(() => `${56 + Math.ceil(props.views.length / 10) * 128}px`)
</script>

<template>
  <section
    :id="id"
    class="flex scroll-mt-28 flex-col gap-2 [contain-intrinsic-size:auto_var(--section-size)] [content-visibility:auto]"
    :style="{ '--section-size': collapsed ? '3.5rem' : intrinsicSize }"
    :data-collapsed="collapsed ? 'true' : undefined"
  >
    <button
      type="button"
      class="sticky top-27 z-10 -mx-1 flex items-center gap-3 rounded-md bg-background/95 px-1 py-1.5 text-left backdrop-blur"
      :aria-expanded="!collapsed"
      @click="emit('toggle')"
    >
      <LucideChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="collapsed ? '-rotate-90' : ''"
      />
      <img v-if="iconUrl" :src="iconUrl" alt="" class="size-8 shrink-0 rounded-full" loading="lazy" decoding="async">
      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-2">
          <h2 class="truncate text-sm font-semibold">{{ name }}</h2>
          <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
            {{ t("cardBox.stats.ownedOfTotal", { owned, total }) }}
            · {{ t("cardBox.stats.percent", { percent }) }}
          </span>
        </div>
        <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-primary transition-[width]"
            :style="{ width: `${percent}%`, ...(color ? { backgroundColor: color } : {}) }"
          />
        </div>
      </div>
    </button>
    <CardBoxCardGrid v-if="!collapsed" :views="views" />
  </section>
</template>
