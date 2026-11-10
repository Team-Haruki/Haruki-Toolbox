<script setup lang="ts">
/**
 * The endpoint list: one row per endpoint inside a bordered panel. On a wide
 * panel the rows read as a table (endpoint, callback, subscriptions, created,
 * actions) under a header line; on a narrow one each row stacks the same
 * parts. The bearer token the list response carries is never printed, only
 * whether one is set.
 */
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideExternalLink,
  LucideKeyRound,
  LucideLoader2,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideTrash2,
  LucideUsers,
  LucideWebhook,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminWebhookStatusBadge from "./AdminWebhookStatusBadge.vue"
import { formatNumberCN } from "@/lib/number-format"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AdminWebhookEndpoint } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  endpointsLoading: boolean
  /** A failed list load; shown in place of the (empty) list with a retry. */
  error?: ErrorDescription | null
  endpoints: AdminWebhookEndpoint[]
  endpointsGeneratedAt: string
  endpointsTotal: number
  /** Settings or endpoints are loading: the refresh button spins. */
  refreshing: boolean
  formatDate: (value?: string) => string
}>()

const emit = defineEmits<{
  (event: "create"): void
  (event: "retry"): void
  (event: "refresh"): void
  (event: "open-subscribers", webhook: AdminWebhookEndpoint): void
  (event: "open-edit", webhook: AdminWebhookEndpoint): void
  (event: "confirm-delete", webhook: AdminWebhookEndpoint): void
}>()

const { t } = useI18n()

const ICON_BUTTON = "size-8 shrink-0 pointer-coarse:size-10"
</script>

<template>
  <AdminPanel flush :title="t('adminWebhooks.list.title')" :description="t('adminWebhooks.list.description')">
    <template #actions>
      <Button variant="outline" size="sm" :disabled="props.refreshing" @click="emit('refresh')">
        <LucideLoader2 v-if="props.refreshing" class="size-4 animate-spin" />
        <LucideRefreshCw v-else class="size-4" />
        {{ t("adminWebhooks.actions.refresh") }}
      </Button>
      <Button v-if="props.canMutate" size="sm" @click="emit('create')">
        <LucidePlus class="size-4" />
        {{ t("adminWebhooks.actions.create") }}
      </Button>
    </template>

    <div v-if="props.endpointsLoading" class="divide-y divide-border/60" data-testid="admin-webhook-list-loading">
      <div v-for="row in 4" :key="row" class="flex items-start gap-3 px-4 py-3">
        <Skeleton class="size-8 shrink-0 rounded-lg" />
        <div class="min-w-0 flex-1 space-y-2">
          <Skeleton class="h-4 w-64 max-w-full" />
          <Skeleton class="h-3 w-40 max-w-full" />
        </div>
      </div>
    </div>
    <!-- A failed load is not an empty list: inline error with a retry. -->
    <LoadErrorState
      v-else-if="props.error"
      :title="t('adminWebhooks.toast.loadEndpointsFailedTitle')"
      :description="props.error.message"
      :detail="props.error.detail"
      :retrying="props.endpointsLoading"
      @retry="emit('retry')"
    />
    <div v-else-if="props.endpoints.length === 0" class="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <LucideWebhook class="size-8 text-muted-foreground/60" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.table.empty") }}</p>
      <Button v-if="props.canMutate" size="sm" @click="emit('create')">
        <LucidePlus class="size-4" />
        {{ t("adminWebhooks.actions.create") }}
      </Button>
    </div>
    <div v-else class="@container">
      <div
        class="hidden items-center gap-x-4 border-b border-border/60 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground @min-[52rem]:flex"
        aria-hidden="true"
      >
        <span class="w-52 shrink-0">{{ t("adminWebhooks.table.endpoint") }}</span>
        <span class="min-w-0 flex-1">{{ t("adminWebhooks.table.callbackUrl") }}</span>
        <span class="w-20 shrink-0 text-right">{{ t("adminWebhooks.table.subscriptions") }}</span>
        <span class="w-36 shrink-0">{{ t("adminWebhooks.table.createdAt") }}</span>
        <span class="w-24 shrink-0 text-right pointer-coarse:w-[7.5rem]">{{ t("adminWebhooks.table.actions") }}</span>
      </div>

      <ul class="divide-y divide-border/60" role="list">
        <li
          v-for="webhook in props.endpoints"
          :key="webhook.id"
          class="relative flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3"
          data-testid="admin-webhook-row"
          :data-webhook-id="webhook.id"
        >
          <!-- Which endpoint and whether it is on. Leaves room for the actions pinned top right on a narrow panel. -->
          <div class="flex min-w-0 basis-full items-start gap-3 pr-24 @min-[52rem]:w-52 @min-[52rem]:shrink-0 @min-[52rem]:basis-auto @min-[52rem]:pr-0! pointer-coarse:pr-32">
            <span
              :class="[
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                webhook.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              ]"
              aria-hidden="true"
            >
              <LucideWebhook class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-mono text-sm font-medium [overflow-wrap:anywhere]">{{ webhook.id }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                <AdminWebhookStatusBadge
                  :active="webhook.enabled"
                  :label="webhook.enabled ? t('adminWebhooks.status.enabled') : t('adminWebhooks.status.disabled')"
                />
                <span
                  v-if="webhook.bearer"
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  :title="t('adminWebhooks.table.bearerTitle')"
                >
                  <LucideKeyRound class="size-3" aria-hidden="true" />
                  Bearer
                </span>
              </div>
            </div>
          </div>

          <div class="min-w-0 basis-full pl-11 @min-[52rem]:flex-1 @min-[52rem]:basis-0 @min-[52rem]:pl-0">
            <!-- The icon sits beside the text block, so a wrapped URL never leaves it alone on a line. -->
            <a
              :href="webhook.callbackUrl"
              target="_blank"
              rel="noreferrer"
              class="inline-flex max-w-full items-start gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              <span class="min-w-0 [overflow-wrap:anywhere]">{{ webhook.callbackUrl }}</span>
              <LucideExternalLink class="mt-[3px] size-3.5 shrink-0" aria-hidden="true" />
            </a>
            <p class="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminWebhooks.table.credential") }}
              <span class="font-mono">{{ webhook.credential }}</span>
            </p>
          </div>

          <div class="pl-11 text-xs tabular-nums @min-[52rem]:w-20 @min-[52rem]:shrink-0 @min-[52rem]:pl-0 @min-[52rem]:pt-0.5 @min-[52rem]:text-right @min-[52rem]:text-sm">
            <span class="mr-1 text-muted-foreground @min-[52rem]:hidden">{{ t("adminWebhooks.table.subscriptions") }}</span>
            <span :class="['font-medium', webhook.subscriptionCount > 0 ? '' : 'text-muted-foreground']">
              {{ formatNumberCN(webhook.subscriptionCount) }}
            </span>
          </div>

          <div class="text-xs tabular-nums text-muted-foreground @min-[52rem]:w-36 @min-[52rem]:shrink-0 @min-[52rem]:pt-1">
            <span class="@min-[52rem]:hidden">{{ t("adminWebhooks.table.createdAt") }}</span>
            {{ props.formatDate(webhook.createdAt) }}
          </div>

          <div class="absolute top-2.5 right-2 flex shrink-0 items-center justify-end @min-[52rem]:static @min-[52rem]:-my-0.5 @min-[52rem]:w-24 pointer-coarse:@min-[52rem]:w-[7.5rem]">
            <Button
              variant="ghost"
              size="icon"
              :class="ICON_BUTTON"
              :title="t('adminWebhooks.actions.subscribers')"
              :aria-label="t('adminWebhooks.actions.subscribers')"
              @click="emit('open-subscribers', webhook)"
            >
              <LucideUsers class="size-4" />
            </Button>
            <template v-if="props.canMutate">
              <Button
                variant="ghost"
                size="icon"
                :class="ICON_BUTTON"
                :title="t('adminWebhooks.actions.edit')"
                :aria-label="t('adminWebhooks.actions.edit')"
                @click="emit('open-edit', webhook)"
              >
                <LucidePencil class="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                :class="[ICON_BUTTON, 'text-destructive hover:text-destructive']"
                :title="t('adminWebhooks.actions.delete')"
                :aria-label="t('adminWebhooks.actions.delete')"
                @click="emit('confirm-delete', webhook)"
              >
                <LucideTrash2 class="size-4" />
              </Button>
            </template>
          </div>
        </li>
      </ul>
    </div>

    <template v-if="!props.endpointsLoading && !props.error && props.endpoints.length > 0" #footer>
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground">
        <span>{{ t("adminWebhooks.list.total", { total: props.endpointsTotal }) }}</span>
        <span v-if="props.endpointsGeneratedAt">
          {{ t("adminWebhooks.list.generatedAt", { date: props.formatDate(props.endpointsGeneratedAt) }) }}
        </span>
      </div>
    </template>
  </AdminPanel>
</template>
