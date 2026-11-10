<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideActivity, LucideArrowUpRight, LucideChevronDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { formatLocalizedDateRange, formatLocalizedDateTime } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
import { UploadLogsTable } from "@/modules/admin-statistics/components"
import {
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import type { AdminGameAccountBinding, UploadLog, UserActivity } from "@/types/admin"
import type { UserActivityScope } from "@/modules/admin-users/composables/useAdminUserDetailState"
import { formatDateTime } from "@/modules/admin-users/constants"
import { describeListedActivity } from "@/modules/admin-users/lib/user-stats"
import UserChip from "./UserChip.vue"
import UserDetailSection from "./UserDetailSection.vue"

/** Rows of the system log shown before "show all". */
const COLLAPSED_ROWS = 8

/**
 * What the user did and what was done to them: the system log as a dense
 * list that folds by its own width, then the recent uploads. Both lists are
 * capped by the backend, so each says how many of the window's entries it
 * shows.
 */
const props = defineProps<{
  userId: string
  loading: boolean
  error: ErrorDescription | null
  activities: UserActivity[]
  uploadLogs: UploadLog[]
  /** The window and totals the activity response reported; null before it loads. */
  scope: UserActivityScope | null
  /** Used to widen the upload-log link to every bound UID. */
  gameBindings?: AdminGameAccountBinding[]
}>()

const emit = defineEmits<{ (e: "retry"): void }>()

const { t, locale } = useI18n()

const expanded = ref(false)
const visibleActivities = computed(() => expanded.value ? props.activities : props.activities.slice(0, COLLAPSED_ROWS))

function formatCount(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value)
}

function listedText(listed: number, total: number | undefined): string {
  const info = describeListedActivity(listed, total)
  return info.truncated
    ? t("adminUsers.detail.activity.listedOf", { listed: formatCount(info.listed), total: formatCount(info.total) })
    : t("adminUsers.detail.activity.listedAll", { total: formatCount(info.total) })
}

const windowText = computed(() => props.scope
  ? formatLocalizedDateRange(props.scope.from, props.scope.to, "dateTime")
  : null)

const systemLogDescription = computed(() => {
  if (props.loading || props.error) return undefined
  const listed = listedText(props.activities.length, props.scope?.systemLogTotal)
  return windowText.value ? `${windowText.value} · ${listed}` : listed
})

const uploadLogDescription = computed(() => {
  const base = t("adminUsers.detail.activity.uploadLogsDescription")
  if (props.loading || props.error) return base
  return `${base} ${listedText(props.uploadLogs.length, props.scope?.uploadLogTotal)}`
})

// The upload-logs page filters by game UID (the backend has no toolbox-user
// filter), so the link carries every UID known for this user: the bound ones
// plus any seen in the recent logs.
const uploadLogsLink = computed(() => {
  const uids = new Set<string>()
  for (const binding of props.gameBindings ?? []) {
    if (binding.gameUserId) uids.add(binding.gameUserId)
  }
  for (const log of props.uploadLogs) {
    if (log.gameUserId) uids.add(log.gameUserId)
  }
  if (uids.size === 0) return null
  return { name: "admin.uploadLogs", query: { uid: Array.from(uids).join(",") } }
})

/** The actor, when the entry is something another account did to this user. */
function otherActor(activity: UserActivity): string | null {
  return activity.actorUserId && activity.actorUserId !== props.userId ? activity.actorUserId : null
}

// The window is stated above the list, so a row only needs day and time;
// the full timestamp is in the tooltip.
function formatRowTime(value: string): string {
  return formatLocalizedDateTime(value, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
}

function requestLine(activity: UserActivity): string {
  return [activity.method, activity.path].filter(Boolean).join(" ")
}

function formatUploadTime(value?: string) {
  return formatDateTime(value ?? "")
}

function methodLabel(value?: string) {
  return resolveUploadMethodLabel(value, t)
}

function serverLabel(value?: string) {
  return resolveUploadServerLabel(value, t)
}

function dataTypeLabel(value?: string) {
  return resolveUploadDataTypeLabel(value, t)
}
</script>

<template>
  <UserDetailSection
    :title="t('adminUsers.detail.activity.title')"
    :description="systemLogDescription"
    :loading="loading"
    :error="error"
    :error-title="t('adminUsers.detail.toast.loadActivityFailedTitle')"
    :empty="activities.length === 0"
    :empty-text="t('adminUsers.detail.activity.empty')"
    :empty-icon="LucideActivity"
    :skeleton-rows="3"
    data-testid="admin-user-activity"
    @retry="emit('retry')"
  >
    <div class="@container">
      <!-- Captions for the table form; a folded row labels itself by position. -->
      <div class="hidden grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.3fr)_8rem] gap-x-3 border-b border-border/60 bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground @min-[44rem]:grid">
        <span>{{ t("adminUsers.detail.activity.columns.result") }}</span>
        <span>{{ t("adminUsers.detail.activity.columns.action") }}</span>
        <span>{{ t("adminUsers.detail.activity.columns.path") }}</span>
        <span class="text-right">{{ t("adminUsers.detail.activity.columns.time") }}</span>
      </div>
      <ul class="divide-y divide-border/60">
        <li
          v-for="activity in visibleActivities"
          :key="activity.id"
          class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 px-4 py-2 @min-[44rem]:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1.3fr)_8rem]"
        >
          <div class="col-start-1 row-start-1">
            <UserChip :tone="activity.result === 'success' ? 'success' : 'danger'">
              {{ activity.result === "success" ? t("adminUsers.common.success") : t("adminUsers.common.failed") }}
            </UserChip>
          </div>
          <div class="col-start-2 row-start-1 min-w-0">
            <p class="text-sm font-medium [overflow-wrap:anywhere]">{{ activity.action }}</p>
            <p v-if="otherActor(activity)" class="text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminUsers.detail.activity.byActor", { actor: otherActor(activity) }) }}
            </p>
          </div>
          <p
            v-if="requestLine(activity)"
            class="col-span-2 col-start-2 row-start-2 min-w-0 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere] @min-[44rem]:col-span-1 @min-[44rem]:col-start-3 @min-[44rem]:row-start-1"
          >
            {{ requestLine(activity) }}
          </p>
          <time
            class="col-start-3 row-start-1 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[44rem]:col-start-4"
            :datetime="activity.eventTime"
            :title="formatDateTime(activity.eventTime)"
          >
            {{ formatRowTime(activity.eventTime) }}
          </time>
        </li>
      </ul>
      <div v-if="activities.length > COLLAPSED_ROWS" class="border-t border-border/60 px-4 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 gap-1 px-2 text-xs text-muted-foreground"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          {{ expanded ? t("adminUsers.detail.activity.showFewer") : t("adminUsers.detail.activity.showAll", { count: formatCount(activities.length) }) }}
          <LucideChevronDown :class="['size-3.5 transition-transform duration-200', expanded ? 'rotate-180' : '']" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </UserDetailSection>

  <!-- The shared upload-log table draws its own frame, so it gets a heading
       above it rather than a panel around it. -->
  <section v-if="!error" class="flex min-w-0 flex-col gap-2" data-testid="admin-user-upload-logs">
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-1">
      <div class="min-w-0 flex-1 basis-48">
        <h2 class="text-sm font-semibold">{{ t("adminUsers.detail.activity.uploadLogsTitle") }}</h2>
        <p class="mt-0.5 text-xs text-muted-foreground">{{ uploadLogDescription }}</p>
      </div>
      <Button v-if="uploadLogsLink" variant="outline" size="sm" as-child>
        <RouterLink :to="uploadLogsLink">
          {{ t("adminUsers.detail.activity.viewAllUploads") }}
          <LucideArrowUpRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </Button>
    </div>
    <UploadLogsTable
      :loading="loading"
      :logs="uploadLogs"
      :total="uploadLogs.length"
      :page="1"
      :total-pages="1"
      :method-label="methodLabel"
      :server-label="serverLabel"
      :data-type-label="dataTypeLabel"
      :format-time="formatUploadTime"
      :show-pagination="false"
    />
  </section>
</template>
