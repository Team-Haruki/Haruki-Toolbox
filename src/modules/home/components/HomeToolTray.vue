<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideLock, LucideCloudUpload, LucideClock } from "lucide-vue-next"
import type { HomeTray } from "@/modules/home/lib/home-trays"

export interface HomeToolStatus {
  text: string
  kind: "lock" | "data" | "live"
}

const props = defineProps<{
  tray: HomeTray
  /** Status line per tool URL (sign-in needed, data needed, live event info). */
  statuses: Record<string, HomeToolStatus | undefined>
  /** A requirement most of the tray shares; said once here instead of on every tile. */
  notice?: HomeToolStatus | null
  /** `side`: the tray stands in a narrow column next to other content and fills its height. */
  layout?: "wide" | "side"
}>()

const { t } = useI18n()

const STATUS_ICONS = { lock: LucideLock, data: LucideCloudUpload, live: LucideClock } as const

function tileStatus(url: string): HomeToolStatus | undefined {
  const status = props.statuses[url]
  return status && status.kind === props.notice?.kind ? undefined : status
}
</script>

<template>
  <section
    :data-home-tray="tray.id"
    :aria-labelledby="`home-tray-${tray.id}`"
    :class="layout === 'side' ? 'flex h-full flex-col' : ''"
  >
    <div class="mb-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 px-0.5">
      <h2 :id="`home-tray-${tray.id}`" class="flex items-center gap-2 text-sm font-semibold">
        <span class="home-tray-marker size-2 rounded-[3px]" aria-hidden="true" />
        {{ t(tray.titleKey) }}
      </h2>
      <p
        v-if="notice"
        class="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        :data-home-tray-notice="notice.kind"
      >
        <component :is="STATUS_ICONS[notice.kind]" class="size-3" aria-hidden="true" />
        {{ notice.text }}
      </p>
    </div>

    <!-- The tools people come for: one tinted card each, the tool's icon
         repeated large and faint in the corner. -->
    <ul
      v-if="tray.emphasis === 'feature'"
      :class="[
        'grid grid-cols-2 gap-3',
        layout === 'side' ? 'flex-1 sm:grid-cols-4 lg:auto-rows-fr lg:grid-cols-2' : 'lg:grid-cols-4',
      ]"
    >
      <li v-for="tool in tray.tools" :key="tool.url" class="flex">
        <RouterLink
          :to="tool.url"
          class="home-tray-feature group relative isolate flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-xl border p-3.5 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4"
        >
          <component :is="tool.icon" class="home-tray-watermark absolute -bottom-5 -right-4 -z-10 size-24" aria-hidden="true" />
          <span class="home-tray-well-solid flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm" aria-hidden="true">
            <component :is="tool.icon" class="size-5" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="text-[15px] font-semibold leading-snug">{{ t(tool.titleKey) }}</span>
            <span v-if="tool.descriptionKey" class="text-xs leading-snug text-muted-foreground">{{ t(tool.descriptionKey) }}</span>
            <span
              v-if="tileStatus(tool.url)"
              class="mt-auto inline-flex items-center gap-1 self-start rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm"
              :data-home-tool-status="tileStatus(tool.url)!.kind"
            >
              <component :is="STATUS_ICONS[tileStatus(tool.url)!.kind]" class="size-3" aria-hidden="true" />
              {{ tileStatus(tool.url)!.text }}
            </span>
          </span>
        </RouterLink>
      </li>
    </ul>

    <!-- Reference trays: one tray divided into compartments. Cells share
         hairlines instead of floating as separate cards; the -1px margins
         hide the outer row and column of cell borders under the tray's own. -->
    <div v-else class="overflow-hidden rounded-xl border bg-card shadow-xs">
      <ul class="-mb-px -mr-px grid grid-cols-2 md:grid-cols-3">
        <li v-for="tool in tray.tools" :key="tool.url" class="flex border-b border-r">
          <RouterLink
            :to="tool.url"
            :title="tool.descriptionKey ? t(tool.descriptionKey) : undefined"
            class="home-tray-cell group flex min-w-0 flex-1 items-center gap-3 p-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-4"
          >
            <span class="home-tray-well flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors" aria-hidden="true">
              <component :is="tool.icon" class="size-4.5" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="text-sm font-semibold leading-snug">{{ t(tool.titleKey) }}</span>
              <span
                v-if="tileStatus(tool.url)"
                class="mt-1.5 inline-flex items-center gap-1 self-start rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                :data-home-tool-status="tileStatus(tool.url)!.kind"
              >
                <component :is="STATUS_ICONS[tileStatus(tool.url)!.kind]" class="size-3" aria-hidden="true" />
                {{ tileStatus(tool.url)!.text }}
              </span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>
