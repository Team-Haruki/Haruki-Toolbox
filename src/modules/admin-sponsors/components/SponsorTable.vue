<script setup lang="ts">
/**
 * The sponsor list as a dense table: who, which plan, the recorded amount,
 * status with the effective expiry, the Toolbox link, the "keep my edits"
 * switch and the edit button. The panel body is the `@container`: from 50rem
 * of width the cells sit in fixed columns under captions; below that the
 * name keeps the first line with the controls and the rest folds under it.
 * Search, the category filter and paging run in the browser over the whole
 * list the backend sent.
 */
import { computed, toRef } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideHeartHandshake,
  LucideLoader2,
  LucidePencil,
  LucideRefreshCw,
  LucideSearch,
  LucideSearchX,
  LucideSparkles,
  LucideUserPlus,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { formatLocalizedDate } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"
import {
  useSponsorListView,
  type SponsorCategoryFilter,
} from "@/modules/admin-sponsors/composables/useSponsorListView"
import { categoryBadgeVariant } from "@/modules/admin-sponsors/lib/manual-duration"
import { formatSponsorAmount } from "@/modules/admin-sponsors/lib/sponsor-stats"
import type { AdminSponsorProfile } from "@/types/admin"

const props = defineProps<{
  sponsors: AdminSponsorProfile[]
  loading: boolean
  loadError: ErrorDescription | null
  refreshing: boolean
  syncing: boolean
  generatedAt: string
  isToggling: (sponsorId: string) => boolean
  formatDate: (value?: string) => string
}>()

const emit = defineEmits<{
  (event: "refresh"): void
  (event: "retry"): void
  (event: "sync"): void
  (event: "create"): void
  (event: "edit", sponsor: AdminSponsorProfile): void
  /** The switch was flipped: `disabled` is the requested "do not update from Afdian". */
  (event: "toggle", sponsor: AdminSponsorProfile, disabled: boolean): void
}>()

const { t, te, locale } = useI18n()

const {
  query,
  category,
  page,
  pageSize,
  overview,
  filtered,
  totalPages,
  rows,
  filtering,
  goToPage,
  clearFilters,
} = useSponsorListView(toRef(props, "sponsors"))

const categoryOptions = computed<Array<{ value: SponsorCategoryFilter; label: string; count: number }>>(() => [
  { value: "all", label: t("adminSponsors.filter.all"), count: overview.value.total },
  { value: "current", label: t("adminSponsors.category.current"), count: overview.value.current },
  { value: "former", label: t("adminSponsors.category.former"), count: overview.value.former },
])

const pagerLabel = computed(() => filtering.value
  ? t("adminSponsors.list.filteredTotal", { count: formatNumberCN(filtered.value.length), total: formatNumberCN(overview.value.total) })
  : t("adminSponsors.list.total", { total: formatNumberCN(overview.value.total) }))

function displayName(sponsor: AdminSponsorProfile) {
  return sponsor.name || t("adminSponsors.common.anonymous")
}

function initial(sponsor: AdminSponsorProfile) {
  return displayName(sponsor).charAt(0).toUpperCase()
}

function sourceLabel(source: string) {
  if (!source) return t("adminSponsors.common.fallback")
  const key = `adminSponsors.source.${source.toLowerCase()}`
  return te(key) ? t(key) : source
}

function amountLabel(sponsor: AdminSponsorProfile) {
  return sponsor.totalAmount === null
    ? null
    : t("adminSponsors.contribution.amount", { amount: formatSponsorAmount(sponsor.totalAmount, locale.value) })
}

function expiryLabel(sponsor: AdminSponsorProfile) {
  if (!sponsor.planExpiresAt) return null
  const date = formatLocalizedDate(sponsor.planExpiresAt, "date")
  return t(sponsor.category === "current" ? "adminSponsors.table.expiresOn" : "adminSponsors.table.expiredOn", { date })
}

function syncStateLabel(sponsor: AdminSponsorProfile) {
  return sponsor.afdianSyncDisabled ? t("adminSponsors.afdianSync.disabled") : t("adminSponsors.afdianSync.enabled")
}
</script>

<template>
  <AdminPanel :title="t('adminSponsors.list.title')" :description="t('adminSponsors.list.description')" flush data-testid="sponsor-list">
    <template #actions>
      <Button
        variant="outline"
        size="icon"
        class="size-8 pointer-coarse:size-10"
        :disabled="loading || refreshing"
        :title="t('adminSponsors.actions.refresh')"
        :aria-label="t('adminSponsors.actions.refresh')"
        @click="emit('refresh')"
      >
        <LucideLoader2 v-if="refreshing" class="size-4 animate-spin" />
        <LucideRefreshCw v-else class="size-4" />
      </Button>
      <!-- Sync and create stay off while the list could not be loaded; refresh is the way back. -->
      <Button variant="outline" size="sm" :disabled="loading || syncing || !!loadError" @click="emit('sync')">
        <LucideLoader2 v-if="syncing" class="size-4 animate-spin" />
        <LucideSparkles v-else class="size-4" />
        {{ t("adminSponsors.actions.syncAfdian") }}
      </Button>
      <Button size="sm" :disabled="loading || !!loadError" @click="emit('create')">
        <LucideUserPlus class="size-4" />
        {{ t("adminSponsors.actions.create") }}
      </Button>
    </template>

    <div class="@container">
      <!-- A failed load is shown instead of the empty "sync from Afdian" call to action. -->
      <LoadErrorState
        v-if="!loading && loadError"
        :title="t('adminSponsors.toast.loadFailedTitle')"
        :description="loadError.message"
        :detail="loadError.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />

      <div v-else-if="loading" class="divide-y divide-border/60" aria-busy="true">
        <div v-for="row in 6" :key="row" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="size-9 shrink-0 rounded-full" />
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton class="h-3.5 w-40 max-w-full" />
            <Skeleton class="h-3 w-56 max-w-full" />
          </div>
          <Skeleton class="hidden h-5 w-16 rounded-full @min-[50rem]:block" />
          <Skeleton class="h-5 w-9 rounded-full" />
        </div>
      </div>

      <div v-else-if="sponsors.length === 0" class="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
        <LucideHeartHandshake class="size-8 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">{{ t("adminSponsors.table.empty") }}</p>
        <Button variant="outline" size="sm" :disabled="syncing" @click="emit('sync')">
          <LucideLoader2 v-if="syncing" class="size-4 animate-spin" />
          <LucideSparkles v-else class="size-4" />
          {{ t("adminSponsors.actions.syncAfdian") }}
        </Button>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 px-4 py-2.5">
          <div class="relative min-w-0 flex-1 basis-52 @min-[40rem]:max-w-xs">
            <LucideSearch class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              v-model="query"
              type="search"
              class="h-8 pl-8 pointer-coarse:h-10"
              :maxlength="128"
              :aria-label="t('adminSponsors.filter.search')"
              :placeholder="t('adminSponsors.filter.searchPlaceholder')"
            />
          </div>
          <div class="inline-flex shrink-0 rounded-lg bg-muted p-0.5" role="group" :aria-label="t('adminSponsors.filter.category')">
            <button
              v-for="option in categoryOptions"
              :key="option.value"
              type="button"
              :aria-pressed="category === option.value"
              :class="[
                'rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-9',
                category === option.value ? 'bg-card text-foreground ring-1 ring-border/70' : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="category = option.value"
            >
              {{ option.label }}
              <span class="ml-0.5 tabular-nums opacity-70">{{ formatNumberCN(option.count) }}</span>
            </button>
          </div>
          <p class="flex flex-wrap gap-x-3 text-xs tabular-nums text-muted-foreground @min-[40rem]:ml-auto">
            <span v-if="overview.manualProfile > 0">{{ t("adminSponsors.list.manualProfile", { count: formatNumberCN(overview.manualProfile) }) }}</span>
            <span v-if="overview.migrationPending > 0">{{ t("adminSponsors.list.migrationPending", { count: formatNumberCN(overview.migrationPending) }) }}</span>
            <span v-if="generatedAt">{{ t("adminSponsors.generatedAt", { date: formatDate(generatedAt) }) }}</span>
          </p>
        </div>

        <div v-if="rows.length === 0" class="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <LucideSearchX class="size-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminSponsors.filter.noMatch") }}</p>
          <Button variant="outline" size="sm" @click="clearFilters">{{ t("adminSponsors.filter.clear") }}</Button>
        </div>

        <!-- Laid out with flex, exposed as a table: rows and cells keep their
             meaning for assistive tech in both the column and the folded layout. -->
        <div v-else class="divide-y divide-border/60" role="table" :aria-label="t('adminSponsors.list.title')">
          <!-- Column captions, only where the cells sit in columns. -->
          <div class="hidden items-center gap-x-3 bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground @min-[50rem]:flex" role="row">
            <span class="min-w-0 flex-1" role="columnheader">{{ t("adminSponsors.table.supporter") }}</span>
            <span class="w-36 shrink-0" role="columnheader">{{ t("adminSponsors.table.tier") }}</span>
            <span class="w-20 shrink-0 text-right" role="columnheader">{{ t("adminSponsors.table.amount") }}</span>
            <span class="w-32 shrink-0" role="columnheader">{{ t("adminSponsors.table.status") }}</span>
            <span class="w-16 shrink-0" role="columnheader">{{ t("adminSponsors.table.toolbox") }}</span>
            <span class="w-14 shrink-0 text-center" role="columnheader">{{ t("adminSponsors.table.protect") }}</span>
            <span class="w-8 shrink-0 pointer-coarse:w-10" role="columnheader"><span class="sr-only">{{ t("adminSponsors.actions.edit") }}</span></span>
          </div>
          <div
            v-for="sponsor in rows"
            :key="sponsor.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2"
            role="row"
            :data-sponsor="sponsor.id"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3" role="cell">
              <Avatar class="size-9 shrink-0 border">
                <AvatarImage :src="sponsor.avatar" :alt="displayName(sponsor)" />
                <AvatarFallback class="text-xs font-semibold">{{ initial(sponsor) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <p class="truncate text-sm font-medium" :title="displayName(sponsor)">{{ displayName(sponsor) }}</p>
                <p class="truncate text-xs text-muted-foreground" :title="sponsor.id">
                  {{ sourceLabel(sponsor.source) }}
                  · <span class="font-mono text-[11px]">{{ sponsor.id }}</span>
                </p>
              </div>
            </div>

            <!-- Folded under the name on a narrow panel; `contents` puts the
                 cells straight into the row's columns on a wide one. -->
            <div class="order-last flex basis-full flex-wrap items-center gap-x-2.5 gap-y-1 pl-12 @min-[50rem]:order-none @min-[50rem]:contents" role="none">
              <div role="cell" class="order-3 min-w-0 max-w-full text-xs text-muted-foreground @min-[50rem]:order-none @min-[50rem]:w-36 @min-[50rem]:shrink-0">
                <p
                  v-if="sponsor.planName"
                  class="truncate @min-[50rem]:text-sm @min-[50rem]:text-foreground"
                  :title="sponsor.planName"
                >
                  {{ sponsor.planName }}
                </p>
                <p v-else class="hidden @min-[50rem]:block @min-[50rem]:text-sm">{{ t("adminSponsors.common.fallback") }}</p>
                <p v-if="sponsor.afdianMonths > 0" class="hidden truncate tabular-nums @min-[50rem]:block">
                  {{ t("adminSponsors.contribution.month", { count: sponsor.afdianMonths }) }}
                </p>
              </div>
              <p
                role="cell"
                :class="[
                  'order-3 text-xs tabular-nums @min-[50rem]:order-none @min-[50rem]:w-20 @min-[50rem]:shrink-0 @min-[50rem]:text-right @min-[50rem]:text-sm',
                  amountLabel(sponsor) ? '' : 'hidden text-muted-foreground @min-[50rem]:block',
                ]"
              >
                {{ amountLabel(sponsor) ?? t("adminSponsors.common.fallback") }}
              </p>
              <!-- Narrow: the chips take the first folded line, plan and amount the second. -->
              <span class="order-2 h-0 basis-full @min-[50rem]:hidden" aria-hidden="true" />
              <div role="cell" class="order-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 @min-[50rem]:order-none @min-[50rem]:w-32 @min-[50rem]:shrink-0 @min-[50rem]:flex-col @min-[50rem]:items-start">
                <Badge :variant="categoryBadgeVariant(sponsor.category)" size="sm">
                  {{ t(`adminSponsors.category.${sponsor.category}`) }}
                </Badge>
                <span
                  v-if="expiryLabel(sponsor)"
                  class="text-xs tabular-nums text-muted-foreground"
                  :title="`${t('adminSponsors.table.effectiveExpiry')}: ${formatDate(sponsor.planExpiresAt)}`"
                >
                  {{ expiryLabel(sponsor) }}
                </span>
              </div>
              <div role="cell" class="order-1 @min-[50rem]:order-none @min-[50rem]:w-16 @min-[50rem]:shrink-0">
                <Badge :variant="sponsor.toolboxBound ? 'sky' : 'muted'" size="sm">
                  {{ t(sponsor.toolboxBound ? "adminSponsors.binding.bound" : "adminSponsors.binding.unbound") }}
                </Badge>
              </div>
            </div>

            <div class="flex shrink-0 justify-center @min-[50rem]:w-14" role="cell" :title="syncStateLabel(sponsor)">
              <Switch
                :model-value="sponsor.afdianSyncDisabled"
                :disabled="isToggling(sponsor.id)"
                :aria-label="t('adminSponsors.table.protectLabel', { name: displayName(sponsor) })"
                @update:model-value="emit('toggle', sponsor, !!$event)"
              />
            </div>
            <div class="shrink-0" role="cell">
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground pointer-coarse:size-10"
                :title="t('adminSponsors.actions.edit')"
                :aria-label="t('adminSponsors.actions.edit')"
                @click="emit('edit', sponsor)"
              >
                <LucidePencil class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template v-if="!loading && !loadError && sponsors.length > 0" #footer>
      <AdminPagination
        :total="filtered.length"
        :page="page"
        :page-size="pageSize"
        :total-pages="totalPages"
        :total-label="pagerLabel"
        @update:page-size="pageSize = $event"
        @prev-page="goToPage(page - 1)"
        @next-page="goToPage(page + 1)"
        @go-to-page="goToPage"
      />
    </template>
  </AdminPanel>
</template>
