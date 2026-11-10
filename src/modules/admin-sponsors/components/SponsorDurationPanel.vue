<script setup lang="ts">
/**
 * Where a sponsor's time comes from, as one group of the edit dialog: the
 * Afdian part, the manual part and the effective expiry side by side, then
 * the Afdian orders (read-only) and the manual entries, which are added and
 * edited in their own dialog.
 */
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideAlertTriangle,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import { categoryBadgeVariant } from "@/modules/admin-sponsors/lib/manual-duration"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AdminManualDuration, AdminSponsorDetail } from "@/types/admin"

const props = defineProps<{
  detail: AdminSponsorDetail | null
  loading: boolean
  loadError: ErrorDescription | null
  deleting: boolean
  formatDate: (value?: string) => string
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  deleteEntry: (entry: AdminManualDuration) => Promise<void>
}>()

const emit = defineEmits<{
  new: []
  edit: [entry: AdminManualDuration]
  retry: []
}>()

const { t } = useI18n()

const deleteConfirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const entryToDelete = ref<AdminManualDuration | null>(null)

function amountLabel(amount: number, unit: "day" | "month") {
  return t(`adminSponsors.duration.amount.${unit}`, { count: amount })
}

function requestDelete(entry: AdminManualDuration) {
  entryToDelete.value = entry
  deleteConfirmOpen.value = true
}

function executeDelete() {
  const entry = entryToDelete.value
  return entry ? props.deleteEntry(entry) : Promise.resolve()
}
</script>

<template>
  <SettingsGroup :title="t('adminSponsors.duration.title')" data-testid="sponsor-duration">
    <template #action>
      <Badge v-if="detail" :variant="categoryBadgeVariant(detail.sponsor.category)" size="sm">
        {{ t(`adminSponsors.category.${detail.sponsor.category}`) }}
      </Badge>
    </template>

    <div v-if="loading && !detail" class="flex flex-col gap-2 px-4 py-3">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-24 w-full" />
    </div>

    <LoadErrorState
      v-else-if="loadError && !detail"
      :description="loadError.message"
      :detail="loadError.detail"
      :retrying="loading"
      @retry="emit('retry')"
    />

    <template v-else-if="detail">
      <p
        v-if="detail.sponsor.durationMigrationPending"
        class="flex items-start gap-2 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300"
      >
        <LucideAlertTriangle class="mt-px size-4 shrink-0" aria-hidden="true" />
        {{ t("adminSponsors.duration.migrationPending") }}
      </p>

      <!-- Afdian part + manual part = effective -->
      <div>
        <dl class="grid grid-cols-1 divide-y divide-border/60 @min-[30rem]:grid-cols-3 @min-[30rem]:divide-x @min-[30rem]:divide-y-0">
          <div class="min-w-0 px-4 py-3">
            <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.afdianPart") }}</dt>
            <dd class="mt-1 text-sm font-medium tabular-nums">
              {{ detail.afdian.expiresAt ? formatDate(detail.afdian.expiresAt) : t("adminSponsors.duration.none") }}
            </dd>
            <dd class="text-xs tabular-nums text-muted-foreground">
              {{ t("adminSponsors.duration.afdianMonths", { count: detail.afdian.months }) }}
            </dd>
          </div>
          <div class="min-w-0 px-4 py-3">
            <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.manualPart") }}</dt>
            <dd class="mt-1 text-sm font-medium tabular-nums">
              {{ t("adminSponsors.duration.manualCount", { count: detail.manualDurations.length }) }}
            </dd>
            <dd class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.stackRule") }}</dd>
          </div>
          <div class="min-w-0 px-4 py-3">
            <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.effective") }}</dt>
            <dd class="mt-1 text-sm font-semibold tabular-nums text-primary">
              {{ detail.effectiveExpiresAt ? formatDate(detail.effectiveExpiresAt) : t("adminSponsors.duration.none") }}
            </dd>
          </div>
        </dl>
        <p v-if="detail.afdian.reportedExpiresAt" class="border-t border-border/60 px-4 py-2 text-xs tabular-nums text-muted-foreground">
          {{ t("adminSponsors.duration.reported", { date: formatDate(detail.afdian.reportedExpiresAt) }) }}
        </p>
      </div>

      <!-- Afdian orders (read-only) -->
      <div>
        <h4 class="flex items-baseline justify-between gap-3 px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground">
          {{ t("adminSponsors.duration.orders.title") }}
          <span v-if="detail.afdian.orders.length > 0" class="tabular-nums">{{ detail.afdian.orders.length }}</span>
        </h4>
        <p v-if="detail.afdian.orders.length === 0" class="px-4 pb-3 text-xs text-muted-foreground">
          {{ t("adminSponsors.duration.orders.empty") }}
        </p>
        <div v-else class="max-h-56 overflow-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th class="py-1.5 pr-2 pl-4 text-left font-medium">{{ t("adminSponsors.duration.orders.paidAt") }}</th>
                <th class="px-2 py-1.5 text-left font-medium">{{ t("adminSponsors.duration.orders.plan") }}</th>
                <th class="px-2 py-1.5 text-left font-medium">{{ t("adminSponsors.duration.orders.kind") }}</th>
                <th class="py-1.5 pr-4 pl-2 text-right font-medium">{{ t("adminSponsors.duration.orders.amount") }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr v-for="order in detail.afdian.orders" :key="order.outTradeNo">
                <td class="py-1.5 pr-2 pl-4 whitespace-nowrap tabular-nums">{{ formatDate(order.paidAt) }}</td>
                <td class="px-2 py-1.5 [overflow-wrap:anywhere]">
                  {{ order.planTitle || (order.planId ? order.planId : t("adminSponsors.duration.orders.customPlan")) }}
                </td>
                <td class="px-2 py-1.5 whitespace-nowrap">
                  <template v-if="order.kind === 'duration'">
                    {{ t("adminSponsors.duration.orders.months", { count: order.month }) }}
                  </template>
                  <span v-else class="text-muted-foreground">{{ t(`adminSponsors.duration.orders.kinds.${order.kind}`) }}</span>
                </td>
                <td class="py-1.5 pr-4 pl-2 text-right whitespace-nowrap tabular-nums">
                  {{ order.totalAmount !== null ? t("adminSponsors.contribution.amount", { amount: order.totalAmount }) : t("adminSponsors.common.fallback") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manual entries: edited in their own dialog, never inside the profile form -->
      <div>
        <div class="flex items-center justify-between gap-2 px-4 pt-2.5 pb-1.5">
          <h4 class="text-xs font-medium text-muted-foreground">
            {{ t("adminSponsors.duration.manual.title") }}
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            :disabled="detail.sponsor.durationMigrationPending"
            @click="emit('new')"
          >
            <LucidePlus class="size-4" />
            {{ t("adminSponsors.duration.manual.add") }}
          </Button>
        </div>
        <p v-if="detail.manualDurations.length === 0" class="px-4 pb-3 text-xs text-muted-foreground">
          {{ t("adminSponsors.duration.manual.empty") }}
        </p>
        <ul v-else class="divide-y divide-border/60 border-t border-border/60" role="list">
          <li
            v-for="entry in detail.manualDurations"
            :key="entry.id"
            class="flex items-start gap-3 px-4 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-2 text-sm font-medium tabular-nums">
                {{ amountLabel(entry.amount, entry.unit) }}
                <Badge v-if="entry.origin === 'migration'" variant="amber" size="sm">{{ t("adminSponsors.duration.manual.migrated") }}</Badge>
              </p>
              <p class="text-xs [overflow-wrap:anywhere]">{{ entry.note }}</p>
              <p class="mt-0.5 text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
                {{ t("adminSponsors.duration.manual.startsAt", { date: formatDate(entry.startsAt) }) }}
                · {{ t("adminSponsors.duration.manual.createdBy", { user: entry.createdBy, date: formatDate(entry.createdAt) }) }}
                <template v-if="entry.updatedBy">
                  · {{ t("adminSponsors.duration.manual.updatedBy", { user: entry.updatedBy, date: formatDate(entry.updatedAt) }) }}
                </template>
              </p>
            </div>
            <div class="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground pointer-coarse:size-10"
                :title="t('adminSponsors.duration.manual.edit')"
                :aria-label="t('adminSponsors.duration.manual.edit')"
                @click="emit('edit', entry)"
              >
                <LucidePencil class="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
                :title="t('adminSponsors.duration.manual.delete')"
                :aria-label="t('adminSponsors.duration.manual.delete')"
                :disabled="deleting"
                @click="requestDelete(entry)"
              >
                <LucideTrash2 class="size-4" />
              </Button>
            </div>
          </li>
        </ul>
      </div>
    </template>

    <ConfirmDialog
      v-model:open="deleteConfirmOpen"
      :title="t('adminSponsors.duration.manual.deleteTitle')"
      :description="t('adminSponsors.duration.manual.deleteDescription', { amount: entryToDelete ? amountLabel(entryToDelete.amount, entryToDelete.unit) : '' })"
      :confirm-label="t('adminSponsors.duration.manual.delete')"
      destructive
      :on-confirm="executeDelete"
    />
  </SettingsGroup>
</template>
