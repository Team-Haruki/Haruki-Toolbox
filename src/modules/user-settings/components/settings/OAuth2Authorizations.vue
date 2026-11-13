<script setup lang="ts">
import { nextTick, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Globe, KeyRound, Loader2, MonitorSmartphone, RefreshCw, Trash2 } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { getScopeLabel, isKnownScope } from "@/modules/user-settings/api/oauth2"
import { useOAuthAuthorizations } from "@/modules/user-settings/composables/useOAuthAuthorizations"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"

const { t } = useI18n()
const {
  groups,
  isLoading,
  loadError,
  isRevoking,
  revokingDeviceId,
  appRevokeTarget,
  showAppRevokeDialog,
  deviceRevokeTarget,
  showDeviceRevokeDialog,
  fetchAuthorizations,
  confirmAppRevoke,
  handleAppRevoke,
  confirmDeviceRevoke,
  handleDeviceRevoke,
  deviceName,
} = useOAuthAuthorizations()

// After a revoke the clicked button is gone with its row; focus returns to
// the list toolbar so keyboard and screen-reader users do not land on <body>.
const toolbarRef = ref<HTMLElement | null>(null)

function restoreFocus() {
  void nextTick(() => {
    toolbarRef.value?.focus()
  })
}

function formatDate(iso: string): string {
  return formatLocalizedDateTime(iso, "dateTime", iso)
}
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <!-- Toolbar: how many apps, and refresh. A native wrapper so the focus
         target after a revoke is a real element. -->
    <div
      ref="toolbarRef"
      tabindex="-1"
      class="flex min-h-7 items-center justify-between gap-3 rounded-sm px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <p class="text-[13px] font-medium text-muted-foreground">
        <template v-if="!isLoading && !loadError && groups.length > 0">
          {{ t("userSettings.oauthAuthorizations.count", { count: groups.length }) }}
        </template>
      </p>
      <Button
        variant="outline"
        size="sm"
        class="h-7 gap-1 px-2 text-xs"
        :disabled="isLoading"
        @click="fetchAuthorizations()"
      >
        <RefreshCw class="size-3.5" :class="isLoading ? 'animate-spin' : ''" aria-hidden="true" />
        {{ t("userSettings.oauthAuthorizations.refresh") }}
      </Button>
    </div>

    <div v-if="isLoading" class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-4 py-3">
        <Skeleton class="size-8 shrink-0 rounded-lg" />
        <div class="min-w-0 flex-1 space-y-2">
          <Skeleton class="h-4 w-40 max-w-full" />
          <Skeleton class="h-3 w-56 max-w-full" />
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="rounded-xl border bg-card">
      <LoadErrorState
        :title="t('userSettings.oauthAuthorizations.toast.fetchFailedTitle')"
        :description="loadError.message"
        :detail="loadError.detail"
        :retrying="isLoading"
        @retry="fetchAuthorizations()"
      />
    </div>

    <div
      v-else-if="groups.length === 0"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card px-4 py-10 text-center"
    >
      <KeyRound class="size-8 text-muted-foreground/60" />
      <p class="text-sm font-medium">{{ t("userSettings.oauthAuthorizations.emptyTitle") }}</p>
    </div>

    <!-- One block per app: the app and its "revoke everything" on the first
         line, what it may do under it, then its devices one line each. -->
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="group in groups"
        :key="group.key"
        class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card"
        data-testid="oauth-client-group"
        :data-client-id="group.clientId"
      >
        <div class="flex items-start gap-3 px-4 py-3">
          <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
            <Bot v-if="group.clientType === 'confidential'" class="size-4" />
            <Globe v-else class="size-4" />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="truncate text-sm font-medium">{{ group.clientName }}</span>
              <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {{
                  group.clientType === 'confidential'
                    ? t("userSettings.oauthAuthorizations.clientType.bot")
                    : t("userSettings.oauthAuthorizations.clientType.website")
                }}
              </span>
            </div>

            <ul v-if="group.browserGrants.length > 0" class="mt-1.5 flex flex-col gap-1.5">
              <li
                v-for="row in group.browserGrants"
                :key="row.key"
                class="flex flex-wrap items-center gap-x-3 gap-y-1"
                data-testid="oauth-browser-grant"
              >
                <span class="flex flex-wrap gap-1">
                  <span
                    v-for="scope in row.authorization.scopes"
                    :key="scope"
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      isKnownScope(scope)
                        ? 'bg-secondary text-secondary-foreground'
                        : 'border border-dashed text-muted-foreground',
                    ]"
                    :title="isKnownScope(scope) ? undefined : scope"
                  >
                    {{ getScopeLabel(scope) }}
                  </span>
                </span>
                <span class="text-xs tabular-nums text-muted-foreground">
                  {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(row.authorization.createdAt) }}
                </span>
              </li>
            </ul>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class="-mr-1 size-8 shrink-0 text-destructive hover:text-destructive pointer-coarse:size-10"
            :disabled="isRevoking"
            :title="t('userSettings.oauthAuthorizations.revokeApp')"
            :aria-label="t('userSettings.oauthAuthorizations.revokeApp')"
            @click="confirmAppRevoke(group)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>

        <section v-if="group.deviceGrants.length > 0" class="bg-muted/20">
          <p class="px-4 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">
            {{ t("userSettings.oauthAuthorizations.devices.title", { count: group.deviceGrants.length }) }}
          </p>
          <ul class="divide-y divide-border/60">
            <li
              v-for="row in group.deviceGrants"
              :key="row.key"
              class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
              data-testid="oauth-device-grant"
            >
              <span class="flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
                <MonitorSmartphone class="size-4 text-muted-foreground" />
              </span>
              <!-- min width: on phones the revoke button wraps below instead of squeezing the date. -->
              <div class="min-w-[12rem] flex-1">
                <p class="break-words text-sm font-medium" data-testid="oauth-device-label">{{ deviceName(row.authorization) }}</p>
                <p class="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(row.authorization.createdAt) }}
                </p>
              </div>
              <Button
                v-if="row.authorization.consentRequestId?.trim()"
                variant="outline"
                size="sm"
                class="ml-auto h-7 shrink-0 gap-1 px-2 text-xs text-destructive hover:text-destructive pointer-coarse:h-10"
                :disabled="isRevoking"
                @click="confirmDeviceRevoke(row.authorization)"
              >
                <Loader2 v-if="revokingDeviceId === row.authorization.consentRequestId?.trim()" class="size-3.5 animate-spin" />
                {{ t("userSettings.oauthAuthorizations.devices.revoke") }}
              </Button>
            </li>
          </ul>
        </section>
      </li>
    </ul>
  </div>

  <ConfirmDialog
    v-model:open="showAppRevokeDialog"
    :title="t('userSettings.oauthAuthorizations.dialog.title')"
    :confirm-label="t('userSettings.oauthAuthorizations.dialog.revoke')"
    destructive
    :on-confirm="handleAppRevoke"
    @success="restoreFocus"
  >
    <template #description>
      {{ t("userSettings.oauthAuthorizations.dialog.description", { clientName: appRevokeTarget?.clientName ?? '' }) }}
      <template v-if="appRevokeTarget && appRevokeTarget.deviceGrants.length > 0">
        {{ t("userSettings.oauthAuthorizations.dialog.devicesNote", { count: appRevokeTarget.deviceGrants.length }, appRevokeTarget.deviceGrants.length) }}
      </template>
    </template>
  </ConfirmDialog>

  <ConfirmDialog
    v-model:open="showDeviceRevokeDialog"
    :title="t('userSettings.oauthAuthorizations.deviceDialog.title')"
    :description="t('userSettings.oauthAuthorizations.deviceDialog.description', {
      label: deviceRevokeTarget ? deviceName(deviceRevokeTarget) : '',
      clientName: deviceRevokeTarget?.clientName || deviceRevokeTarget?.clientId || '',
    })"
    :confirm-label="t('userSettings.oauthAuthorizations.devices.revoke')"
    destructive
    :on-confirm="handleDeviceRevoke"
    @success="restoreFocus"
  />
</template>
