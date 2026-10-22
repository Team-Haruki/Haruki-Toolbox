<script setup lang="ts">
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
  <section class="space-y-4 rounded-xl border p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-semibold">{{ t("adminSponsors.duration.title") }}</h3>
      <Badge v-if="detail" :variant="categoryBadgeVariant(detail.sponsor.category)" class="px-2.5 py-1 text-xs">
        {{ t(`adminSponsors.category.${detail.sponsor.category}`) }}
      </Badge>
    </div>

    <div v-if="loading && !detail" class="space-y-2">
      <Skeleton class="h-16 w-full" />
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
        class="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground"
      >
        <LucideAlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        {{ t("adminSponsors.duration.migrationPending") }}
      </p>

      <!-- Afdian part + manual part = effective -->
      <dl class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-lg bg-muted/30 p-3">
          <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.afdianPart") }}</dt>
          <dd class="mt-1 text-sm font-medium tabular-nums">
            {{ detail.afdian.expiresAt ? formatDate(detail.afdian.expiresAt) : t("adminSponsors.duration.none") }}
          </dd>
          <dd class="text-xs text-muted-foreground tabular-nums">
            {{ t("adminSponsors.duration.afdianMonths", { count: detail.afdian.months }) }}
          </dd>
        </div>
        <div class="rounded-lg bg-muted/30 p-3">
          <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.manualPart") }}</dt>
          <dd class="mt-1 text-sm font-medium tabular-nums">
            {{ t("adminSponsors.duration.manualCount", { count: detail.manualDurations.length }) }}
          </dd>
          <dd class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.stackRule") }}</dd>
        </div>
        <div class="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3">
          <dt class="text-xs text-muted-foreground">{{ t("adminSponsors.duration.effective") }}</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums">
            {{ detail.effectiveExpiresAt ? formatDate(detail.effectiveExpiresAt) : t("adminSponsors.duration.none") }}
          </dd>
        </div>
      </dl>
      <p v-if="detail.afdian.reportedExpiresAt" class="text-xs text-muted-foreground">
        {{ t("adminSponsors.duration.reported", { date: formatDate(detail.afdian.reportedExpiresAt) }) }}
      </p>

      <!-- Afdian orders (read-only) -->
      <div class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {{ t("adminSponsors.duration.orders.title") }}
        </h4>
        <p v-if="detail.afdian.orders.length === 0" class="text-xs text-muted-foreground">
          {{ t("adminSponsors.duration.orders.empty") }}
        </p>
        <div v-else class="max-h-56 overflow-auto rounded-lg border">
          <table class="w-full text-xs">
            <thead class="bg-muted/40 text-muted-foreground">
              <tr>
                <th class="px-2 py-1.5 text-left font-medium">{{ t("adminSponsors.duration.orders.paidAt") }}</th>
                <th class="px-2 py-1.5 text-left font-medium">{{ t("adminSponsors.duration.orders.plan") }}</th>
                <th class="px-2 py-1.5 text-left font-medium">{{ t("adminSponsors.duration.orders.kind") }}</th>
                <th class="px-2 py-1.5 text-right font-medium">{{ t("adminSponsors.duration.orders.amount") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in detail.afdian.orders" :key="order.outTradeNo" class="border-t">
                <td class="whitespace-nowrap px-2 py-1.5 tabular-nums">{{ formatDate(order.paidAt) }}</td>
                <td class="px-2 py-1.5">
                  {{ order.planTitle || (order.planId ? order.planId : t("adminSponsors.duration.orders.customPlan")) }}
                </td>
                <td class="whitespace-nowrap px-2 py-1.5">
                  <template v-if="order.kind === 'duration'">
                    {{ t("adminSponsors.duration.orders.months", { count: order.month }) }}
                  </template>
                  <template v-else>{{ t(`adminSponsors.duration.orders.kinds.${order.kind}`) }}</template>
                </td>
                <td class="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                  {{ order.totalAmount !== null ? t("adminSponsors.contribution.amount", { amount: order.totalAmount }) : t("adminSponsors.common.fallback") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manual entries: edited in their own dialog, never inside the profile form -->
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {{ t("adminSponsors.duration.manual.title") }}
          </h4>
          <Button
            variant="outline"
            size="sm"
            :disabled="detail.sponsor.durationMigrationPending"
            @click="emit('new')"
          >
            <LucidePlus class="mr-1.5 h-4 w-4" />
            {{ t("adminSponsors.duration.manual.add") }}
          </Button>
        </div>
        <p v-if="detail.manualDurations.length === 0" class="text-xs text-muted-foreground">
          {{ t("adminSponsors.duration.manual.empty") }}
        </p>
        <ul v-else class="divide-y rounded-lg border">
          <li
            v-for="entry in detail.manualDurations"
            :key="entry.id"
            class="flex items-start gap-3 px-3 py-2"
          >
            <div class="min-w-0 flex-1 space-y-0.5">
              <p class="flex flex-wrap items-center gap-2 text-sm font-medium">
                {{ amountLabel(entry.amount, entry.unit) }}
                <Badge v-if="entry.origin === 'migration'" variant="amber">{{ t("adminSponsors.duration.manual.migrated") }}</Badge>
              </p>
              <p class="break-words text-xs">{{ entry.note }}</p>
              <p class="text-xs text-muted-foreground tabular-nums">
                {{ t("adminSponsors.duration.manual.startsAt", { date: formatDate(entry.startsAt) }) }}
                · {{ t("adminSponsors.duration.manual.createdBy", { user: entry.createdBy, date: formatDate(entry.createdAt) }) }}
                <template v-if="entry.updatedBy">
                  · {{ t("adminSponsors.duration.manual.updatedBy", { user: entry.updatedBy, date: formatDate(entry.updatedAt) }) }}
                </template>
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="size-8"
                :title="t('adminSponsors.duration.manual.edit')"
                :aria-label="t('adminSponsors.duration.manual.edit')"
                @click="emit('edit', entry)"
              >
                <LucidePencil class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-destructive hover:text-destructive"
                :title="t('adminSponsors.duration.manual.delete')"
                :aria-label="t('adminSponsors.duration.manual.delete')"
                :disabled="deleting"
                @click="requestDelete(entry)"
              >
                <LucideTrash2 class="h-4 w-4" />
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
  </section>
</template>
