<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { useMediaQuery } from "@vueuse/core"
import {
  LucideArrowRight,
  LucideHome,
  LucideSearch,
  LucideSettings,
  LucideUserRound,
} from "lucide-vue-next"
import { ADMIN_NAV_ITEMS, WEB_NAV_SECTIONS } from "@/config/navigation"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import SearchResultRow from "@/modules/search/components/SearchResultRow.vue"
import {
  useGlobalSearch,
  type SearchMoreAction,
  type SearchRow,
  type SearchSection,
} from "@/modules/search/composables/useGlobalSearch"
import type { SearchEntryType, SearchResultEntry, SearchScope } from "@/modules/search/lib/search-index"
import { resolveSearchThumb } from "@/modules/search/lib/search-thumbs"

const LIST_ID = "global-search-list"

/** The list page a "view all" row opens, by its route title. */
const LIST_TITLE_KEYS: Partial<Record<SearchEntryType, string>> = {
  music: "route.musicLibrary.list",
  card: "route.cards.list",
  event: "route.events.list",
  gacha: "route.gachas.list",
}

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const {
  query,
  scope,
  scopes,
  hasQuery,
  region,
  blurUnreleased,
  loading,
  failed,
  results,
  sections,
  rows,
  remember,
  clearRecents,
  reload,
  reset,
} = useGlobalSearch()

const isOpen = ref(false)
const activeIndex = ref(0)

// A keyboard hint is noise on touch devices: no Tab to press.
const hasFinePointer = useMediaQuery("(pointer: fine)")
const regionLabel = computed(() => resolveSekaiRegionLabel(region.value, t))
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const activeRow = computed<SearchRow | null>(() => rows.value[activeIndex.value] ?? null)
const activeDomId = computed(() => (activeRow.value ? rowDomId(activeRow.value.id) : undefined))

/** Sidebar and admin-menu icons by path, so a page row looks like its menu entry. */
const pageIcons = computed(() => {
  const icons = new Map<string, Component>([
    ["/", LucideHome],
    ["/settings", LucideSettings],
  ])
  for (const section of WEB_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.url && item.icon) icons.set(item.url, item.icon)
      for (const sub of item.items ?? []) {
        const icon = sub.icon ?? item.icon
        if (icon) icons.set(sub.url, icon)
      }
    }
  }
  for (const item of ADMIN_NAV_ITEMS) {
    icons.set(`/admin/${item.segment}`, item.icon)
  }
  return icons
})

function pageIcon(entry: SearchResultEntry): Component | undefined {
  if (entry.type !== "page") return undefined
  return pageIcons.value.get(entry.page.path) ?? (entry.page.path.startsWith("/user/") ? LucideUserRound : undefined)
}

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown)
})

watch(isOpen, (open) => {
  activeIndex.value = 0
  if (!open) {
    reset()
  }
})

// A new list starts at its first row.
watch(
  () => rows.value.map((row) => row.id).join("|"),
  () => {
    activeIndex.value = 0
  },
)

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
    event.preventDefault()
    isOpen.value = !isOpen.value
  }
}

function open() {
  isOpen.value = true
}

defineExpose({ open })

function onInput(event: Event) {
  // Read the raw value rather than v-model: the letters typed into an IME
  // (pinyin, romaji) already find things before they are committed.
  query.value = (event.target as HTMLInputElement).value
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.isComposing) {
    return
  }
  if (event.key === "ArrowDown") {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === "Enter") {
    if (activeRow.value) {
      event.preventDefault()
      selectRow(activeRow.value)
    }
  } else if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
    // Tab walks the scopes instead of leaving the field: the list is driven
    // from here with the arrow keys, and Escape closes the dialog.
    event.preventDefault()
    cycleScope(event.shiftKey ? -1 : 1)
  }
}

function moveActive(delta: number) {
  const count = rows.value.length
  if (count === 0) {
    return
  }
  activeIndex.value = (activeIndex.value + delta + count) % count
  void nextTick(() => {
    if (activeDomId.value) {
      document.getElementById(activeDomId.value)?.scrollIntoView({ block: "nearest" })
    }
  })
}

/** With a query typed, Tab skips the scopes that found nothing. */
function cycleScope(delta: number) {
  const list = scopes.value.filter((value) => value === scope.value || scopeCount(value) !== 0)
  const current = Math.max(0, list.indexOf(scope.value))
  scope.value = list[(current + delta + list.length) % list.length]
}

function rowDomId(id: string) {
  return `global-search-row-${id.replace(/[^\w-]+/g, "-")}`
}

function setActive(id: string) {
  const index = rows.value.findIndex((row) => row.id === id)
  if (index >= 0) {
    activeIndex.value = index
  }
}

function selectRow(row: SearchRow) {
  if (row.kind === "more") {
    selectMore(row.more)
    return
  }
  remember(row.entry)
  isOpen.value = false
  void router.push(row.entry.to)
}

function selectMore(more: SearchMoreAction) {
  if (more.kind === "scope") {
    scope.value = more.type
    return
  }
  isOpen.value = false
  void router.push(more.to)
}

function scopeLabel(value: SearchScope) {
  return value === "all" ? t("globalSearch.scopes.all") : t(`globalSearch.groups.${value}`)
}

function scopeCount(value: SearchScope): number | null {
  if (!hasQuery.value) return null
  return value === "all" ? results.value.total : results.value.counts[value]
}

function sectionTitle(section: SearchSection) {
  if (section.kind === "recent" || section.kind === "ongoing" || section.kind === "suggested") {
    return t(`globalSearch.sections.${section.kind}`)
  }
  return section.type ? t(`globalSearch.groups.${section.type}`) : ""
}

function moreLabel(more: SearchMoreAction) {
  const listKey = LIST_TITLE_KEYS[more.type]
  return more.kind === "list" && listKey
    ? t("globalSearch.more.list", { page: t(listKey), count: more.total })
    : t("globalSearch.more.scope", { count: more.total })
}

function isEntryUnreleased(entry: SearchResultEntry) {
  return isUnreleasedContent(entry.releaseAt, Date.now())
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <!-- Anchored near the top so the list grows downward without the field moving. -->
    <DialogContent
      size="lg"
      class="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 sm:top-[10dvh] sm:max-h-[78dvh]"
    >
      <DialogTitle class="sr-only">{{ t("globalSearch.title") }}</DialogTitle>
      <DialogDescription class="sr-only">{{ t("globalSearch.description") }}</DialogDescription>

      <div class="flex shrink-0 items-center gap-2.5 border-b border-border/60 py-1 pr-12 pl-4">
        <LucideSearch class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          :value="query"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          :aria-controls="LIST_ID"
          :aria-activedescendant="activeDomId"
          :aria-label="t('globalSearch.title')"
          :placeholder="t('globalSearch.placeholder')"
          class="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="go"
          data-testid="global-search-input"
          @input="onInput"
          @keydown="onInputKeydown"
        >
      </div>

      <!-- What to search in. Reached with Tab from the field, or by pointer. -->
      <div
        role="radiogroup"
        :aria-label="t('globalSearch.scopes.label')"
        class="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-testid="global-search-scopes"
      >
        <button
          v-for="value in scopes"
          :key="value"
          type="button"
          role="radio"
          tabindex="-1"
          :aria-checked="scope === value"
          :data-scope="value"
          :class="[
            'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs transition-colors pointer-coarse:h-8',
            scope === value
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            scope !== value && scopeCount(value) === 0 ? 'opacity-50' : '',
          ]"
          @click="scope = value"
        >
          {{ scopeLabel(value) }}
          <span v-if="scopeCount(value) != null" class="tabular-nums opacity-70">{{ scopeCount(value) }}</span>
        </button>
      </div>

      <div
        :id="LIST_ID"
        role="listbox"
        :aria-label="t('globalSearch.title')"
        class="@container min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5"
        data-testid="global-search-list"
      >
        <div
          v-for="section in sections"
          :key="section.id"
          role="group"
          :aria-labelledby="`global-search-heading-${section.id}`"
          :data-section="section.id"
        >
          <div class="flex items-center justify-between gap-2 px-2.5 pt-2.5 pb-1">
            <p :id="`global-search-heading-${section.id}`" class="text-xs font-medium text-muted-foreground">
              {{ sectionTitle(section) }}
            </p>
            <button
              v-if="section.kind === 'recent'"
              type="button"
              tabindex="-1"
              class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              @click="clearRecents"
            >
              {{ t("globalSearch.sections.clearRecent") }}
            </button>
          </div>
          <ul class="m-0 list-none p-0">
            <SearchResultRow
              v-for="entry in section.items"
              :id="rowDomId(`${section.id}:${entry.key}`)"
              :key="entry.key"
              :entry="entry"
              :active="activeRow?.id === `${section.id}:${entry.key}`"
              :thumb="resolveSearchThumb(entry, region, assetEndpoint)"
              :icon="pageIcon(entry)"
              :unreleased="isEntryUnreleased(entry)"
              :blur="blurUnreleased"
              @select="selectRow({ id: `${section.id}:${entry.key}`, kind: 'entry', entry })"
              @activate="setActive(`${section.id}:${entry.key}`)"
            />
            <li
              v-if="section.more"
              :id="rowDomId(`${section.id}:more`)"
              role="option"
              :aria-selected="activeRow?.id === `${section.id}:more`"
              :class="[
                'flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs',
                activeRow?.id === `${section.id}:more` ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
              ]"
              data-testid="global-search-more"
              @click="selectMore(section.more)"
              @pointermove="setActive(`${section.id}:more`)"
            >
              <span class="min-w-0 truncate">{{ moreLabel(section.more) }}</span>
              <LucideArrowRight class="size-3.5 shrink-0" aria-hidden="true" />
            </li>
          </ul>
        </div>

        <!-- Nothing to list: say why, and what would work. -->
        <div v-if="rows.length === 0" class="px-4 py-10 text-center" data-testid="global-search-empty">
          <p v-if="loading" class="text-sm text-muted-foreground">{{ t("globalSearch.loading") }}</p>
          <p v-else class="text-sm text-muted-foreground">{{ t("globalSearch.empty") }}</p>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <span class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span>{{ t("globalSearch.footerRegion", { region: regionLabel }) }}</span>
          <span v-if="failed" role="alert" class="flex items-center gap-1.5 text-destructive">
            {{ t("globalSearch.loadFailed") }}
            <button type="button" tabindex="-1" class="underline underline-offset-4" @click="reload">
              {{ t("globalSearch.retry") }}
            </button>
          </span>
          <span v-else-if="loading && rows.length > 0" aria-live="polite">{{ t("globalSearch.loading") }}</span>
        </span>
        <!-- Arrows and Enter are what anyone tries; Tab walking the scopes is the one key worth naming. -->
        <span v-if="hasFinePointer">{{ t("globalSearch.scopeHint") }}</span>
      </div>
    </DialogContent>
  </Dialog>
</template>
