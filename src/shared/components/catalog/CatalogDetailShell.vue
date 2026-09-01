<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router"
import { LucideArrowLeft, LucideChevronRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { goBackOr, hasInAppHistory } from "@/lib/router-back"
import { useDocumentTitle } from "@/composables/useDocumentTitle"
import CatalogEmptyState from "./CatalogEmptyState.vue"
import CatalogErrorState from "./CatalogErrorState.vue"
import CatalogRegionSelect from "./CatalogRegionSelect.vue"

/**
 * Standard frame for catalog detail pages: back row with breadcrumb, title
 * row with badges / id / actions, and the loading → error → not-found →
 * content state machine. Sets `document.title` to the entity name.
 */
const props = withDefaults(defineProps<{
  title: string | null
  subtitle?: string | null
  entityId?: number | string | null
  listTitle: string
  listRoute: RouteLocationRaw
  loading?: boolean
  error?: string | null
  notFound?: boolean
  notFoundMessage?: string | null
  errorMessage?: string | null
  retrying?: boolean
  /** Also shown as a red badge next to the title. */
  unreleased?: boolean
  class?: string
}>(), {
  subtitle: null,
  entityId: null,
  loading: false,
  error: null,
  notFound: false,
  notFoundMessage: null,
  errorMessage: null,
  retrying: false,
  unreleased: false,
  class: undefined,
})

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

useDocumentTitle(computed(() => props.title))

/** Track the route so in-component navigation re-checks the history state. */
const canGoBack = computed(() => route.fullPath.length > 0 && hasInAppHistory())

function goBack() {
  goBackOr(router, props.listRoute)
}

const showContent = computed(() => !props.loading && !props.error && !props.notFound && props.title != null)
</script>

<template>
  <div :class="cn('mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4', props.class)" data-slot="catalog-detail-shell">
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" class="h-8 shrink-0 gap-1 px-2" @click="goBack">
        <LucideArrowLeft class="size-4" />
        {{ canGoBack ? t("common.back") : t("catalog.detail.backToList", { list: listTitle }) }}
      </Button>
      <nav class="flex min-w-0 flex-1 items-center gap-1 truncate text-sm text-muted-foreground" :aria-label="t('catalog.detail.breadcrumb')">
        <RouterLink :to="listRoute" class="shrink-0 transition-colors hover:text-foreground">{{ listTitle }}</RouterLink>
        <LucideChevronRight class="size-3.5 shrink-0" aria-hidden="true" />
        <span class="truncate font-medium text-foreground">{{ title ?? (entityId != null ? `#${entityId}` : "…") }}</span>
      </nav>
      <div v-if="$slots.actions" class="ml-auto flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <CatalogErrorState
      v-if="error && !loading"
      :message="errorMessage ?? t('catalog.detail.loadError')"
      :detail="error"
      :retrying="retrying"
      @retry="emit('retry')"
    />

    <template v-else-if="loading">
      <slot name="skeleton">
        <Skeleton class="aspect-[7/4] w-full rounded-lg" />
        <div class="flex flex-col gap-2">
          <Skeleton class="h-6 w-2/3" />
          <Skeleton class="h-4 w-1/3" />
          <Skeleton class="h-24 w-full" />
        </div>
      </slot>
    </template>

    <CatalogEmptyState
      v-else-if="notFound || title == null"
      :message="notFoundMessage ?? t('catalog.detail.notFound')"
      :hint="t('catalog.detail.tryOtherRegion')"
    >
      <template #action>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <CatalogRegionSelect size="sm" />
          <Button as-child variant="outline" size="sm">
            <RouterLink :to="listRoute">{{ t("catalog.detail.backToList", { list: listTitle }) }}</RouterLink>
          </Button>
        </div>
      </template>
    </CatalogEmptyState>

    <template v-else-if="showContent">
      <div class="flex flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="min-w-0 text-2xl font-bold leading-tight">{{ title }}</h1>
          <span
            v-if="unreleased"
            class="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white shadow-sm"
          >
            {{ t("sekaiUnreleased.badge") }}
          </span>
          <slot name="badges" />
          <span v-if="entityId != null" class="font-mono text-sm text-muted-foreground">#{{ entityId }}</span>
        </div>
        <p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
      </div>

      <slot />
    </template>
  </div>
</template>
