<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideActivity, LucideGamepad2, LucideMessagesSquare, LucideUploadCloud } from "lucide-vue-next"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { resolveSocialPlatformLabel } from "@/modules/admin-users/constants"
import { formatSharePercent, type UserActivityWindow, type UserDetailCounts } from "@/modules/admin-users/lib/user-stats"
import UserShareBar from "./UserShareBar.vue"

/**
 * Four figures about one user. The two counts come with the detail response
 * (and follow the section lists once those have loaded, so an add or a
 * removal shows here too); the two activity figures are the response's
 * `activitySummary`, which covers a fixed recent window that the labels name.
 */
const props = defineProps<{
  counts: UserDetailCounts
  /** Null when the detail response carries no activity summary. */
  activity: UserActivityWindow | null
}>()

const { t, locale } = useI18n()

function formatCount(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value)
}

const gameDetail = computed(() => props.counts.verifiedGameBindings == null
  ? null
  : t("adminUsers.detail.stats.verifiedCount", { count: formatCount(props.counts.verifiedGameBindings) }))

const socialDetail = computed(() => props.counts.socialPlatform
  ? t("adminUsers.detail.stats.mainSocial", { platform: resolveSocialPlatformLabel(props.counts.socialPlatform, t) })
  : t("adminUsers.detail.stats.noMainSocial"))

const uploadDetail = computed(() => {
  const activity = props.activity
  if (!activity) return null
  if (activity.uploadLogTotal === 0) return t("adminUsers.detail.stats.noUploads")
  return t("adminUsers.detail.stats.uploadBreakdown", {
    success: formatCount(activity.uploadSuccess),
    failure: formatCount(activity.uploadFailure),
  })
})

const uploadSuccessLabel = computed(() => props.activity?.uploadSuccessPercent == null
  ? null
  : t("adminUsers.detail.stats.uploadSuccessRate", {
      percent: formatSharePercent(props.activity.uploadSuccessPercent, locale.value),
    }))

// The window is at most a day or so back: month, day and time are enough.
function formatRecent(value: string): string {
  return formatLocalizedDateTime(value, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
}

const systemLogDetail = computed(() => {
  const activity = props.activity
  if (!activity) return null
  return activity.lastSystemLog
    ? t("adminUsers.detail.stats.lastAt", { time: formatRecent(activity.lastSystemLog) })
    : t("adminUsers.detail.stats.noEvents")
})
</script>

<template>
  <AdminStatGrid :columns="4" data-testid="admin-user-stats">
    <AdminStatTile
      :label="t('adminUsers.detail.stats.gameBindings')"
      :value="counts.gameBindings"
      :icon="LucideGamepad2"
      tone="primary"
      :detail="gameDetail"
      data-stat="game-bindings"
    />
    <AdminStatTile
      :label="t('adminUsers.detail.stats.authorizedSocials')"
      :value="counts.authorizedSocials"
      :icon="LucideMessagesSquare"
      tone="info"
      :detail="socialDetail"
      data-stat="authorized-socials"
    />
    <AdminStatTile
      :label="t('adminUsers.detail.stats.uploads', { hours: activity?.windowHours ?? 24 })"
      :value="activity?.uploadLogTotal"
      :icon="LucideUploadCloud"
      :tone="activity && activity.uploadFailure > 0 ? 'warning' : 'success'"
      :detail="uploadDetail"
      data-stat="uploads"
    >
      <UserShareBar
        v-if="activity?.uploadSuccessPercent != null && uploadSuccessLabel"
        class="mb-1"
        :percent="activity.uploadSuccessPercent"
        :label="uploadSuccessLabel"
      />
    </AdminStatTile>
    <AdminStatTile
      :label="t('adminUsers.detail.stats.systemLogs', { hours: activity?.windowHours ?? 24 })"
      :value="activity?.systemLogTotal"
      :icon="LucideActivity"
      :detail="systemLogDetail"
      data-stat="system-logs"
    />
  </AdminStatGrid>
</template>
