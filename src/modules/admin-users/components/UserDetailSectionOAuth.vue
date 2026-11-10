<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideKeyRound, LucideMonitorSmartphone } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { getScopeLabel } from "@/modules/user-settings/api"
import type { UserOAuthAuthorization } from "@/modules/admin-users/api/oauth"
import { formatDateTime } from "@/modules/admin-users/constants"
import { resolveOAuthAuthorizationState, summarizeOAuthAuthorizations } from "@/modules/admin-users/lib/user-stats"
import UserChip from "./UserChip.vue"
import UserDetailSection from "./UserDetailSection.vue"

/**
 * The apps the user has authorized, one block each: the app and its state,
 * the client ID, what it may do, and when it was granted. Revoking is for all
 * of them at once (the admin endpoint revokes per user).
 */
const props = defineProps<{
  loading: boolean
  busy: boolean
  error: ErrorDescription | null
  authorizations: UserOAuthAuthorization[]
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  revokeAll: () => Promise<void>
}>()

const emit = defineEmits<{ (e: "retry"): void }>()

const { t } = useI18n()

const revokeConfirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const revokeCount = ref(0)

function requestRevokeAll() {
  revokeCount.value = props.authorizations.length
  revokeConfirmOpen.value = true
}

const fallback = computed(() => t("adminUsers.common.fallback"))

function grantedAt(item: UserOAuthAuthorization) {
  const value = item.createdAt || item.authorizedAt
  return value ? formatDateTime(value) : fallback.value
}

function scopeLabels(item: UserOAuthAuthorization): string[] {
  return (item.scopes ?? []).map((scope) => getScopeLabel(scope))
}

// Counted over the list as loaded: how many of the grants still work.
const description = computed(() => {
  if (props.authorizations.length === 0) return undefined
  const summary = summarizeOAuthAuthorizations(props.authorizations)
  const total = t("adminUsers.detail.oauth.total", { count: props.authorizations.length })
  return summary.active === props.authorizations.length
    ? total
    : `${total} · ${t("adminUsers.detail.oauth.activeCount", { count: summary.active })}`
})
</script>

<template>
  <UserDetailSection
    :title="t('adminUsers.detail.oauth.title')"
    :description="description"
    :loading="loading"
    :error="error"
    :error-title="t('adminUsers.detail.toast.loadOAuthFailedTitle')"
    :empty="authorizations.length === 0"
    :empty-text="t('adminUsers.detail.oauth.empty')"
    :empty-icon="LucideKeyRound"
    data-testid="admin-user-oauth"
    @retry="emit('retry')"
  >
    <template v-if="authorizations.length > 0" #actions>
      <Button
        variant="outline"
        size="sm"
        class="text-destructive hover:text-destructive"
        :disabled="busy"
        @click="requestRevokeAll"
      >
        {{ t("adminUsers.detail.oauth.revokeAll") }}
      </Button>
    </template>

    <ul class="divide-y divide-border/60">
      <li
        v-for="(item, index) in authorizations"
        :key="item.consentRequestId || item.authorizationId || `${item.clientId ?? 'client'}-${index}`"
        class="flex items-start gap-3 px-4 py-2.5"
      >
        <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
          <LucideMonitorSmartphone v-if="item.flowType === 'device'" class="size-4" />
          <LucideKeyRound v-else class="size-4" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span class="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{{ item.clientName || item.clientId || fallback }}</span>
            <UserChip :tone="resolveOAuthAuthorizationState(item) === 'active' ? 'success' : 'default'">
              {{ t(`adminUsers.detail.oauth.status.${resolveOAuthAuthorizationState(item)}`) }}
            </UserChip>
            <span v-if="item.clientType" class="text-xs text-muted-foreground">{{ item.clientType }}</span>
          </div>
          <p v-if="item.clientName && item.clientId" class="mt-0.5 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {{ item.clientId }}
          </p>
          <p v-if="item.flowType === 'device' && item.deviceLabel" class="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {{ t("adminUsers.detail.oauth.device", { name: item.deviceLabel }) }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span v-if="scopeLabels(item).length > 0" class="flex flex-wrap gap-1">
              <span
                v-for="(label, scopeIndex) in scopeLabels(item)"
                :key="`${label}-${scopeIndex}`"
                class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {{ label }}
              </span>
            </span>
            <span class="text-xs tabular-nums text-muted-foreground">
              {{ t("adminUsers.detail.oauth.columns.createdAt") }} {{ grantedAt(item) }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </UserDetailSection>

  <ConfirmDialog
    v-model:open="revokeConfirmOpen"
    :title="t('adminUsers.detail.oauth.revokeAllDialogTitle')"
    :description="t('adminUsers.detail.oauth.revokeAllDialogDescription', { count: revokeCount })"
    :cancel-label="t('adminUsers.common.cancel')"
    :confirm-label="t('adminUsers.detail.oauth.revokeAll')"
    destructive
    :on-confirm="props.revokeAll"
  />
</template>
