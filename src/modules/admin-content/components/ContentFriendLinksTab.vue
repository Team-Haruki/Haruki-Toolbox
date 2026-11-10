<script setup lang="ts">
/**
 * The friend links as one list: order, site (icon, name, what it is, where
 * it goes), tags, actions. Beside it (under it on a narrow page) a breakdown
 * of how many links carry each tag. The list body is its own `@container`:
 * the tags sit in a column from 36rem and fold under the site below that.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideExternalLink,
  LucideLink,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import type { ErrorDescription } from "@/lib/error-utils"
import { normalizeExternalHttpUrl } from "@/lib/external-url"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import { countLinkTags } from "@/modules/admin-content/lib/content-stats"
import type { AdminFriendLink } from "@/types/admin"

const props = defineProps<{
  loading: boolean
  /** A failed load; the empty state below is only for a real empty list. */
  loadError: ErrorDescription | null
  links: AdminFriendLink[]
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "create"): void
  (e: "edit", link: AdminFriendLink): void
  /** Asks the page to confirm and delete the link. */
  (e: "delete", link: AdminFriendLink): void
  (e: "retry"): void
}>()

function safeHref(url: string): string | null {
  return normalizeExternalHttpUrl(url)
}

const TAG_LIMIT = 8

const tagCounts = computed(() => countLinkTags(props.links))
const tagItems = computed<AdminMeterItem[]>(() =>
  tagCounts.value.slice(0, TAG_LIMIT).map((entry) => ({
    key: entry.key,
    label: entry.label,
    value: entry.count,
    text: t("adminContent.countShare", {
      count: formatNumberCN(entry.count),
      percent: formatPercent(sharePercent(entry.count, props.links.length), 0),
    }),
  })))
const hiddenTags = computed(() => Math.max(0, tagCounts.value.length - TAG_LIMIT))
</script>

<template>
  <div class="@container">
    <div class="grid items-start gap-4 @min-[52rem]:grid-cols-[minmax(0,1fr)_17rem]">
      <AdminPanel :title="t('adminContent.linksTab.title')" :description="t('adminContent.linksTab.description')" flush data-testid="content-links">
        <template #actions>
          <Button size="sm" @click="emit('create')">
            <LucidePlus class="size-4" /> {{ t("adminContent.linksTab.createButton") }}
          </Button>
        </template>

        <div class="@container">
          <div v-if="loading" class="divide-y divide-border/60" aria-busy="true">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-2.5">
              <Skeleton class="size-9 shrink-0 rounded-lg" />
              <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton class="h-3.5 w-36 max-w-full" />
                <Skeleton class="h-3 w-64 max-w-full" />
              </div>
            </div>
          </div>
          <LoadErrorState
            v-else-if="loadError"
            :title="t('adminContent.toast.loadLinksFailedTitle')"
            :description="loadError.message"
            :detail="loadError.detail"
            :retrying="loading"
            @retry="emit('retry')"
          />
          <template v-else-if="links.length > 0">
            <div class="hidden items-center gap-x-3 border-b border-border/60 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground @min-[36rem]:flex" aria-hidden="true">
              <span class="w-8 shrink-0 text-right">{{ t("adminContent.linksTab.table.sortOrder") }}</span>
              <span class="min-w-0 flex-1">{{ t("adminContent.linksTab.table.name") }}</span>
              <span class="w-36 shrink-0">{{ t("adminContent.linksTab.table.tags") }}</span>
              <span class="w-[4.25rem] shrink-0 pointer-coarse:w-[5.25rem]" />
            </div>
            <ul class="divide-y divide-border/60" role="list">
              <li
                v-for="link in links"
                :key="link.id"
                class="flex flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-2.5"
                :data-link="link.id"
              >
                <span
                  class="w-5 shrink-0 pt-2 text-right text-xs tabular-nums text-muted-foreground @min-[36rem]:w-8"
                  :title="t('adminContent.linksTab.table.sortOrder')"
                >
                  {{ link.sortOrder }}
                </span>
                <Avatar class="size-9 shrink-0 rounded-lg border">
                  <AvatarImage :src="link.avatar" alt="" class="rounded-lg" />
                  <AvatarFallback class="rounded-lg text-muted-foreground"><LucideLink class="size-4" /></AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium [overflow-wrap:anywhere]">{{ link.name }}</p>
                  <p v-if="link.description" class="text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ link.description }}</p>
                  <!-- Only an http(s) address becomes a link; anything else stays text. -->
                  <a
                    v-if="safeHref(link.url)"
                    :href="safeHref(link.url) ?? undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex w-fit max-w-full items-start gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    <span class="min-w-0 [overflow-wrap:anywhere]">{{ link.url }}</span>
                    <LucideExternalLink class="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  </a>
                  <p v-else class="text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ link.url }}</p>
                </div>
                <!-- Under the site on a narrow list, a column of its own on a wide one. -->
                <div
                  v-if="link.tags?.length"
                  class="order-last flex basis-full flex-wrap gap-1 pl-[5rem] @min-[36rem]:order-none @min-[36rem]:w-36 @min-[36rem]:shrink-0 @min-[36rem]:basis-auto @min-[36rem]:pt-1 @min-[36rem]:pl-0"
                >
                  <span
                    v-for="tag in link.tags"
                    :key="tag"
                    class="max-w-full rounded bg-muted px-1.5 py-0.5 text-xs [overflow-wrap:anywhere]"
                  >
                    {{ tag }}
                  </span>
                </div>
                <span v-else class="hidden w-36 shrink-0 pt-1.5 text-xs text-muted-foreground @min-[36rem]:block">—</span>
                <div class="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground pointer-coarse:size-10"
                    :title="t('adminContent.actions.edit')"
                    :aria-label="t('adminContent.actions.edit')"
                    @click="emit('edit', link)"
                  >
                    <LucidePencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
                    :title="t('adminContent.actions.delete')"
                    :aria-label="t('adminContent.actions.delete')"
                    @click="emit('delete', link)"
                  >
                    <LucideTrash2 class="size-4" />
                  </Button>
                </div>
              </li>
            </ul>
          </template>
          <div v-else class="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <LucideLink class="size-8 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminContent.linksTab.empty") }}</p>
            <Button size="sm" @click="emit('create')">
              <LucidePlus class="size-4" /> {{ t("adminContent.linksTab.createButton") }}
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel
        v-if="!loadError"
        :title="t('adminContent.linksTab.tagPanel.title')"
        :description="t('adminContent.linksTab.tagPanel.description')"
        data-testid="content-link-tags"
      >
        <AdminMeterList
          :items="tagItems"
          :total="links.length"
          :loading="loading"
          :empty-text="t('adminContent.linksTab.tagPanel.empty')"
        />
        <p v-if="hiddenTags > 0" class="mt-3 text-xs tabular-nums text-muted-foreground">
          {{ t("adminContent.linksTab.tagPanel.more", { count: hiddenTags }) }}
        </p>
      </AdminPanel>
    </div>
  </div>
</template>
