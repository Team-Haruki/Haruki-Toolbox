<script setup lang="ts">
/**
 * The figures above the client list. The first tile is the backend's own
 * count of clients; the others are counted from the clients that were loaded
 * (the whole list unless it spans more than one page, which the note under
 * the tiles then says).
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2, LucideKeyRound, LucideLock, LucideMonitorSmartphone } from "lucide-vue-next"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import { type OAuthClientListSummary, ratePercent } from "@/modules/admin-oauth-clients/lib/client-stats"

const props = defineProps<{
  loading: boolean
  /** The list failed to load: the tiles show a dash, not zeros. */
  failed: boolean
  summary: OAuthClientListSummary
  /** All clients the backend holds. */
  total: number
}>()

const { t } = useI18n()

const known = computed(() => !props.failed)
const partial = computed(() => known.value && !props.loading && props.total > props.summary.loaded)

const inactiveDetail = computed(() => {
  const parts = [t("adminOAuthClients.overview.disabledCount", { count: formatNumberCN(props.summary.disabled) })]
  if (props.summary.deleted > 0) {
    parts.push(t("adminOAuthClients.overview.deletedCount", { count: formatNumberCN(props.summary.deleted) }))
  }
  return parts.join(" · ")
})

const deviceDetail = computed(() => {
  const share = ratePercent(props.summary.device, props.summary.loaded)
  return share === null ? null : t("adminOAuthClients.overview.shareOfClients", { percent: formatPercent(share, 0) })
})
</script>

<template>
  <div class="flex flex-col gap-1.5" data-testid="oauth-client-overview">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="t('adminOAuthClients.overview.total')"
        :value="known ? props.total : null"
        :icon="LucideKeyRound"
        tone="primary"
        :loading="props.loading"
        data-stat="total"
      />
      <AdminStatTile
        :label="t('adminOAuthClients.overview.enabled')"
        :value="known ? props.summary.enabled : null"
        :icon="LucideCheckCircle2"
        tone="success"
        :detail="known ? inactiveDetail : null"
        :loading="props.loading"
        data-stat="enabled"
      />
      <AdminStatTile
        :label="t('adminOAuthClients.overview.confidential')"
        :value="known ? props.summary.confidential : null"
        :icon="LucideLock"
        :detail="known ? t('adminOAuthClients.overview.publicCount', { count: formatNumberCN(props.summary.public) }) : null"
        :loading="props.loading"
        data-stat="confidential"
      />
      <AdminStatTile
        :label="t('adminOAuthClients.overview.device')"
        :value="known ? props.summary.device : null"
        :icon="LucideMonitorSmartphone"
        tone="info"
        :detail="known ? deviceDetail : null"
        :loading="props.loading"
        data-stat="device"
      />
    </AdminStatGrid>
    <p v-if="partial" class="px-1 text-xs text-muted-foreground" data-testid="oauth-client-overview-partial">
      {{ t("adminOAuthClients.overview.partialNote", { loaded: formatNumberCN(props.summary.loaded), total: formatNumberCN(props.total) }) }}
    </p>
  </div>
</template>
