<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChevronDown, LucideChevronLeft, LucideChevronRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import CardBoxCardGrid from "@/modules/cards/components/CardBoxCardGrid.vue"
import { resolveGroupPage, type CardBoxCardView } from "@/modules/cards/lib/card-box"

/**
 * One collapsible group (a character or an attribute). The header sticks
 * under the roster strip while its grid scrolls, and the section skips
 * layout work while off-screen, which keeps a 1,400-card page responsive.
 * With `pageSize` (phones) a group larger than a page shows one page of its
 * cards at a time and carries its own pager.
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
  /** Cards shown at once; `null` shows them all. */
  pageSize?: number | null
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

const root = useTemplateRef<HTMLElement>("root")
const requestedPage = ref(1)
const paging = computed(() => resolveGroupPage(props.views.length, props.pageSize ?? null, requestedPage.value))
const shownViews = computed(() => (paging.value.totalPages > 1 ? props.views.slice(paging.value.start, paging.value.end) : props.views))

function goToPage(page: number) {
  requestedPage.value = page
  // The next page starts at the group's heading, not wherever the pager was.
  void nextTick(() => root.value?.scrollIntoView({ block: "start" }))
}

/**
 * Placeholder height while the section is skipped off-screen (`auto` keeps
 * the real size once rendered). Assumes the widest grid; narrower screens
 * over-estimate, which only costs scrollbar accuracy, never layout.
 */
const intrinsicSize = computed(() => `${56 + Math.ceil(shownViews.value.length / 10) * 128}px`)
</script>

<template>
  <section
    :id="id"
    ref="root"
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
    <template v-if="!collapsed">
      <CardBoxCardGrid :views="shownViews" />
      <nav
        v-if="paging.totalPages > 1"
        class="flex items-center justify-center gap-2"
        :aria-label="`${name} ${t('catalog.pagination.label')}`"
        data-testid="card-box-section-pager"
      >
        <Button
          variant="outline"
          size="sm"
          class="size-10 p-0"
          :disabled="paging.page <= 1"
          :aria-label="t('catalog.pagination.prev')"
          @click="goToPage(paging.page - 1)"
        >
          <LucideChevronLeft class="size-4" />
        </Button>
        <span class="min-w-16 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {{ t("catalog.pagination.pageOf", { page: paging.page, total: paging.totalPages }) }}
        </span>
        <Button
          variant="outline"
          size="sm"
          class="size-10 p-0"
          :disabled="paging.page >= paging.totalPages"
          :aria-label="t('catalog.pagination.next')"
          @click="goToPage(paging.page + 1)"
        >
          <LucideChevronRight class="size-4" />
        </Button>
      </nav>
    </template>
  </section>
</template>
