<script setup lang="ts">
/**
 * Who subscribed to an endpoint: three counters and the split by region and
 * by data type (all counted from the subscriber list in this dialog), then
 * the subscriptions as an aligned list.
 */
import { computed } from "vue"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { LucideUsers } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import AdminAnimatedNumber from "@/modules/admin/components/AdminAnimatedNumber.vue"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import type { AdminWebhookSubscriber } from "@/types/admin"
import { type KeyCount, summarizeWebhookSubscribers } from "@/modules/admin-webhooks/lib/webhook-stats"

const props = defineProps<{
  open: boolean
  subscribersLoading: boolean
  subscribers: AdminWebhookSubscriber[]
  subscribersGeneratedAt: string
  webhookId: string
  formatDate: (value?: string) => string
  serverLabel: (value: string) => string
  dataTypeLabel: (value: string) => string
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
}>()

const { t } = useI18n()

const summary = computed(() => summarizeWebhookSubscribers(props.subscribers))

function toMeterItems(rows: readonly KeyCount[], label: (key: string) => string): AdminMeterItem[] {
  return rows.map((row) => ({
    key: row.key,
    label: label(row.key),
    value: row.count,
    text: `${formatNumberCN(row.count)} · ${formatPercent(sharePercent(row.count, summary.value.total), 0)}`,
  }))
}

const serverItems = computed(() => toMeterItems(summary.value.byServer, props.serverLabel))
const dataTypeItems = computed(() => toMeterItems(summary.value.byDataType, props.dataTypeLabel))
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[720px]">
      <DialogHeader>
        <DialogTitle class="[overflow-wrap:anywhere]">{{ t("adminWebhooks.subscribers.title", { id: props.webhookId }) }}</DialogTitle>
        <DialogDescription>
          {{ t("adminWebhooks.subscribers.description") }}
          <span v-if="props.subscribersGeneratedAt" class="mt-1 block tabular-nums">
            {{ t("adminWebhooks.subscribers.generatedAt", { date: props.formatDate(props.subscribersGeneratedAt) }) }}
          </span>
        </DialogDescription>
      </DialogHeader>

      <div class="@container flex min-w-0 flex-col gap-4">
        <div v-if="props.subscribersLoading" class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
          <div v-for="row in 3" :key="row" class="px-4 py-3">
            <Skeleton class="h-4 w-full" />
          </div>
        </div>

        <div
          v-else-if="props.subscribers.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-4 py-10 text-center"
        >
          <LucideUsers class="size-8 text-muted-foreground/60" aria-hidden="true" />
          <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.subscribers.empty") }}</p>
        </div>

        <template v-else>
          <div class="grid gap-x-8 gap-y-4 rounded-xl border bg-card px-4 py-3 @min-[36rem]:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]" data-testid="admin-webhook-subscriber-summary">
            <dl class="grid grid-cols-2 content-start gap-x-4 gap-y-3 @min-[36rem]:grid-cols-1">
              <div>
                <dt class="text-xs text-muted-foreground">{{ t("adminWebhooks.subscribers.totalLabel") }}</dt>
                <dd class="text-lg leading-tight font-semibold"><AdminAnimatedNumber :value="summary.total" /></dd>
              </div>
              <div>
                <dt class="text-xs text-muted-foreground">{{ t("adminWebhooks.subscribers.usersLabel") }}</dt>
                <dd class="text-lg leading-tight font-semibold"><AdminAnimatedNumber :value="summary.users" /></dd>
              </div>
            </dl>
            <div class="min-w-0">
              <h3 class="mb-2 text-xs font-medium text-muted-foreground">{{ t("adminWebhooks.subscribers.byServer") }}</h3>
              <AdminMeterList :items="serverItems" :total="summary.total" />
            </div>
            <div class="min-w-0">
              <h3 class="mb-2 text-xs font-medium text-muted-foreground">{{ t("adminWebhooks.subscribers.byDataType") }}</h3>
              <AdminMeterList :items="dataTypeItems" :total="summary.total" />
            </div>
          </div>

          <div class="overflow-hidden rounded-xl border bg-card">
            <div
              class="hidden grid-cols-[minmax(0,1fr)_5rem_7rem_10rem] gap-x-4 border-b border-border/60 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground @min-[36rem]:grid"
              aria-hidden="true"
            >
              <span>{{ t("adminWebhooks.subscribers.userId") }}</span>
              <span>{{ t("adminWebhooks.subscribers.server") }}</span>
              <span>{{ t("adminWebhooks.subscribers.dataType") }}</span>
              <span>{{ t("adminWebhooks.subscribers.createdAt") }}</span>
            </div>
            <ul class="divide-y divide-border/60" role="list">
              <li
                v-for="subscriber in props.subscribers"
                :key="`${subscriber.userId}-${subscriber.server}-${subscriber.dataType}-${subscriber.createdAt}`"
                class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1 px-4 py-2 @min-[36rem]:grid-cols-[minmax(0,1fr)_5rem_7rem_10rem] @min-[36rem]:gap-x-4"
                data-testid="admin-webhook-subscriber-row"
              >
                <span class="min-w-0 font-mono text-sm tabular-nums [overflow-wrap:anywhere]">{{ subscriber.userId }}</span>
                <span>
                  <span class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {{ props.serverLabel(subscriber.server) }}
                  </span>
                </span>
                <span>
                  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {{ props.dataTypeLabel(subscriber.dataType) }}
                  </span>
                </span>
                <span class="col-span-3 text-xs tabular-nums text-muted-foreground @min-[36rem]:col-span-1">
                  {{ props.formatDate(subscriber.createdAt) }}
                </span>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
