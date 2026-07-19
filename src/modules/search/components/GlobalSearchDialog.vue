<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { LucideCalendarDays, LucideMusic, LucideSquareUserRound } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { SearchEntryType, SearchIndexEntry } from "@/modules/search/lib/search-index"
import { useGlobalSearch } from "@/modules/search/composables/useGlobalSearch"

const ROUTE_BASE: Record<SearchEntryType, string> = {
  music: "/music",
  card: "/cards",
  event: "/events",
}

const TYPE_ICONS: Record<SearchEntryType, typeof LucideMusic> = {
  music: LucideMusic,
  card: LucideSquareUserRound,
  event: LucideCalendarDays,
}

const { t } = useI18n()
const router = useRouter()
const { status, query, region, results, groupedResults, ensureLoaded, reload } = useGlobalSearch()

const isOpen = ref(false)
const activeIndex = ref(0)

const isMac = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
const shortcutLabel = isMac ? "⌘K" : "Ctrl+K"

const hasQuery = computed(() => query.value.trim() !== "")
const activeEntry = computed<SearchIndexEntry | null>(() => results.value[activeIndex.value] ?? null)

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown)
})

watch(isOpen, (open) => {
  if (open) {
    activeIndex.value = 0
    ensureLoaded()
  } else {
    query.value = ""
  }
})

watch(results, () => {
  activeIndex.value = 0
})

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

function onSearchInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  query.value = target?.value ?? ""
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === "Enter") {
    if (activeEntry.value) {
      event.preventDefault()
      selectEntry(activeEntry.value)
    }
  }
}

function moveActive(delta: number) {
  const count = results.value.length
  if (count === 0) {
    return
  }

  activeIndex.value = (activeIndex.value + delta + count) % count
  void nextTick(() => {
    const entry = results.value[activeIndex.value]
    if (entry) {
      document.getElementById(entryDomId(entry))?.scrollIntoView({ block: "nearest" })
    }
  })
}

function entryDomId(entry: SearchIndexEntry) {
  return `global-search-item-${entry.type}-${entry.id}`
}

function isActive(entry: SearchIndexEntry) {
  return activeEntry.value?.type === entry.type && activeEntry.value?.id === entry.id
}

function selectEntry(entry: SearchIndexEntry) {
  isOpen.value = false
  void router.push(`${ROUTE_BASE[entry.type]}/${entry.id}`)
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="top-24 max-w-lg translate-y-0 gap-0 overflow-hidden p-0">
      <DialogTitle class="sr-only">{{ t("globalSearch.title") }}</DialogTitle>
      <DialogDescription class="sr-only">{{ t("globalSearch.description") }}</DialogDescription>
      <!--
        Filtering and ranking are done by the search index (composable); the
        Command context search stays in sync via the bubbled input event, and
        each CommandItem receives the raw query as a keyword so the primitive's
        own matcher never hides a pre-ranked result.
      -->
      <Command class="bg-transparent" @input="onSearchInput" @keydown="onListKeydown">
        <CommandInput :placeholder="t('globalSearch.placeholder')" class="pr-8" />
        <CommandList class="max-h-80">
          <div v-if="status === 'loading'" class="space-y-2 p-3">
            <Skeleton class="h-9 w-full" />
            <Skeleton class="h-9 w-5/6" />
            <Skeleton class="h-9 w-2/3" />
          </div>

          <div v-else-if="status === 'error'" class="flex flex-col items-start gap-2 p-4">
            <p class="text-sm text-muted-foreground">{{ t("globalSearch.error") }}</p>
            <Button variant="outline" size="sm" @click="reload">
              {{ t("globalSearch.retry") }}
            </Button>
          </div>

          <template v-else>
            <p v-if="!hasQuery" class="px-4 py-8 text-center text-sm text-muted-foreground">
              {{ t("globalSearch.typeToSearch") }}
            </p>

            <template v-else>
              <CommandEmpty>{{ t("globalSearch.empty") }}</CommandEmpty>
              <CommandGroup
                v-for="group in groupedResults"
                :key="group.type"
                :heading="t(`globalSearch.groups.${group.type}`)"
              >
                <CommandItem
                  v-for="entry in group.items"
                  :id="entryDomId(entry)"
                  :key="`${entry.type}-${entry.id}`"
                  :value="`${entry.type}-${entry.id}`"
                  :keywords="[query]"
                  :class="isActive(entry) ? 'bg-accent text-accent-foreground' : ''"
                  @select="selectEntry(entry)"
                >
                  <component
                    :is="TYPE_ICONS[entry.type]"
                    class="size-4 shrink-0 text-muted-foreground"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm">{{ entry.title }}</p>
                    <p v-if="entry.subtitle" class="truncate text-xs text-muted-foreground">
                      {{ entry.subtitle }}
                    </p>
                  </div>
                  <span class="shrink-0 text-[10px] text-muted-foreground">#{{ entry.id }}</span>
                </CommandItem>
              </CommandGroup>
            </template>
          </template>
        </CommandList>

        <div class="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
          <span>{{ t("globalSearch.footerRegion", { region: region.toUpperCase() }) }}</span>
          <span>{{ t("globalSearch.footerHint", { shortcut: shortcutLabel }) }}</span>
        </div>
      </Command>
    </DialogContent>
  </Dialog>
</template>
