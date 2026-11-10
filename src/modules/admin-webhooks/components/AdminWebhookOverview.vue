<script setup lang="ts">
/**
 * The figures above the webhook endpoints. The endpoint total is the
 * backend's own count; the rest is counted from the endpoints that were
 * loaded and the global settings. There is no delivery success or failure
 * figure: the backend does not keep a delivery log.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideKeyRound, LucideSend, LucideUsers, LucideWebhook } from "lucide-vue-next"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { formatNumberCN } from "@/lib/number-format"
import type { AdminWebhookSettings } from "@/types/admin"
import type { WebhookEndpointSummary } from "@/modules/admin-webhooks/lib/webhook-stats"

const props = defineProps<{
  endpointsLoading: boolean
  /** The endpoint list failed to load: its tiles show a dash, not zeros. */
  endpointsFailed: boolean
  settingsLoading: boolean
  settingsFailed: boolean
  summary: WebhookEndpointSummary
  /** All endpoints the backend holds. */
  total: number
  settings: AdminWebhookSettings
}>()

const { t } = useI18n()

const endpointsKnown = computed(() => !props.endpointsFailed)
const settingsKnown = computed(() => !props.settingsFailed)

/** Endpoints a callback actually goes out to: their own switch and the global one are both on. */
const delivering = computed(() => (props.settings.enabled ? props.summary.enabled : 0))
const deliveringKnown = computed(() => endpointsKnown.value && settingsKnown.value)
</script>

<template>
  <AdminStatGrid :columns="4" data-testid="admin-webhook-overview">
    <AdminStatTile
      :label="t('adminWebhooks.overview.total')"
      :value="endpointsKnown ? props.total : null"
      :icon="LucideWebhook"
      tone="primary"
      :detail="endpointsKnown ? t('adminWebhooks.overview.enabledDisabled', { enabled: formatNumberCN(props.summary.enabled), disabled: formatNumberCN(props.summary.disabled) }) : null"
      :loading="props.endpointsLoading"
      data-stat="total"
    />
    <AdminStatTile
      :label="t('adminWebhooks.overview.delivering')"
      :value="deliveringKnown ? delivering : null"
      :icon="LucideSend"
      :tone="deliveringKnown && delivering > 0 ? 'success' : 'default'"
      :detail="settingsKnown ? t(props.settings.enabled ? 'adminWebhooks.overview.globalOn' : 'adminWebhooks.overview.globalOff') : null"
      :loading="props.endpointsLoading || props.settingsLoading"
      data-stat="delivering"
    />
    <AdminStatTile
      :label="t('adminWebhooks.overview.subscriptions')"
      :value="endpointsKnown ? props.summary.subscriptions : null"
      :icon="LucideUsers"
      tone="info"
      :detail="endpointsKnown ? t('adminWebhooks.overview.endpointsWithSubscribers', { count: formatNumberCN(props.summary.withSubscribers) }) : null"
      :loading="props.endpointsLoading"
      data-stat="subscriptions"
    />
    <AdminStatTile
      :label="t('adminWebhooks.overview.jwtSecret')"
      :text="settingsKnown ? t(props.settings.jwtSecretConfigured ? 'adminWebhooks.status.configured' : 'adminWebhooks.status.notConfigured') : null"
      :icon="LucideKeyRound"
      :tone="!settingsKnown ? 'default' : props.settings.jwtSecretConfigured ? 'success' : 'warning'"
      :detail="endpointsKnown ? t('adminWebhooks.overview.withBearer', { count: formatNumberCN(props.summary.withBearer) }) : null"
      :loading="props.settingsLoading"
      data-stat="jwtSecret"
    />
  </AdminStatGrid>
</template>
