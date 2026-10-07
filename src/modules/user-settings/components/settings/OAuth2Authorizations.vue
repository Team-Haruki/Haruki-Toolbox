<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Clock, Globe, KeyRound, Loader2, MonitorSmartphone, RefreshCw, Trash2, X } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { getScopeLabel } from "@/modules/user-settings/api/oauth2"
import { useOAuthAuthorizations } from "@/modules/user-settings/composables/useOAuthAuthorizations"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"

const { t } = useI18n()
const {
  groups,
  isLoading,
  isRevoking,
  isRevokingApp,
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

function formatDate(iso: string): string {
  return formatLocalizedDateTime(iso, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }, iso)
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <CardTitle class="flex items-center gap-2">
            <KeyRound class="h-6 w-6" />
            {{ t("userSettings.oauthAuthorizations.title") }}
          </CardTitle>
          <CardDescription>{{ t("userSettings.oauthAuthorizations.description") }}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 text-muted-foreground"
          :disabled="isLoading"
          :title="t('userSettings.oauthAuthorizations.refresh')"
          :aria-label="t('userSettings.oauthAuthorizations.refresh')"
          @click="fetchAuthorizations()"
        >
          <RefreshCw class="h-4 w-4" :class="isLoading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="flex flex-col gap-2">
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center gap-3 rounded-md border bg-muted/20 p-3"
        >
          <Skeleton class="size-10 shrink-0 rounded-md" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-40 max-w-full" />
            <Skeleton class="h-3 w-56 max-w-full" />
          </div>
        </div>
      </div>

      <div
        v-else-if="groups.length === 0"
        class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center"
      >
        <KeyRound class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm font-medium">{{ t("userSettings.oauthAuthorizations.emptyTitle") }}</p>
        <p class="text-sm text-muted-foreground">{{ t("userSettings.oauthAuthorizations.emptyDescription") }}</p>
      </div>

      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="group in groups"
          :key="group.key"
          class="rounded-md border bg-muted/20 p-3"
          data-testid="oauth-client-group"
          :data-client-id="group.clientId"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot v-if="group.clientType === 'confidential'" class="size-5" />
              <Globe v-else class="size-5" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="truncate text-sm font-medium">{{ group.clientName }}</span>
                <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {{
                    group.clientType === 'confidential'
                      ? t("userSettings.oauthAuthorizations.clientType.bot")
                      : t("userSettings.oauthAuthorizations.clientType.website")
                  }}
                </span>
              </div>

              <ul v-if="group.browserGrants.length > 0" class="flex flex-col gap-2">
                <li
                  v-for="row in group.browserGrants"
                  :key="row.key"
                  class="mt-1.5"
                  data-testid="oauth-browser-grant"
                >
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="scope in row.authorization.scopes"
                      :key="scope"
                      class="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
                    >
                      {{ getScopeLabel(scope) }}
                    </span>
                  </div>
                  <p class="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock class="size-3 shrink-0" />
                    <span class="truncate">
                      {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(row.authorization.createdAt) }}
                    </span>
                  </p>
                </li>
              </ul>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive shrink-0"
              :disabled="isRevoking"
              :title="t('userSettings.oauthAuthorizations.revokeApp')"
              :aria-label="t('userSettings.oauthAuthorizations.revokeApp')"
              @click="confirmAppRevoke(group)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>

          <section v-if="group.deviceGrants.length > 0" class="mt-3 space-y-2 border-t pt-3">
            <p class="text-xs font-medium text-muted-foreground">
              {{ t("userSettings.oauthAuthorizations.devices.title", { count: group.deviceGrants.length }) }}
            </p>
            <ul class="flex flex-col gap-2">
              <li
                v-for="row in group.deviceGrants"
                :key="row.key"
                class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-background p-2.5"
                data-testid="oauth-device-grant"
              >
                <MonitorSmartphone class="size-4 shrink-0 text-muted-foreground" />
                <!-- min width: on phones the revoke button wraps below instead of squeezing the date. -->
                <div class="min-w-[12rem] flex-1">
                  <p class="break-words text-sm font-medium" data-testid="oauth-device-label">{{ deviceName(row.authorization) }}</p>
                  <p class="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock class="size-3 shrink-0" />
                    <span class="truncate">
                      {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(row.authorization.createdAt) }}
                    </span>
                  </p>
                </div>
                <Button
                  v-if="row.authorization.consentRequestId?.trim()"
                  variant="outline"
                  size="sm"
                  class="ml-auto shrink-0 text-destructive hover:text-destructive"
                  :disabled="isRevoking"
                  @click="confirmDeviceRevoke(row.authorization)"
                >
                  <Loader2 v-if="revokingDeviceId === row.authorization.consentRequestId?.trim()" class="h-4 w-4 animate-spin" />
                  <Trash2 v-else class="h-4 w-4" />
                  {{ t("userSettings.oauthAuthorizations.devices.revoke") }}
                </Button>
              </li>
            </ul>
          </section>
        </li>
      </ul>
    </CardContent>
  </Card>

  <AlertDialog v-model:open="showAppRevokeDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("userSettings.oauthAuthorizations.dialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("userSettings.oauthAuthorizations.dialog.description", { clientName: appRevokeTarget?.clientName ?? '' }) }}
          <template v-if="appRevokeTarget && appRevokeTarget.deviceGrants.length > 0">
            {{ t("userSettings.oauthAuthorizations.dialog.devicesNote", { count: appRevokeTarget.deviceGrants.length }, appRevokeTarget.deviceGrants.length) }}
          </template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          {{ t("userSettings.common.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" :disabled="isRevoking" @click="handleAppRevoke">
          <Loader2 v-if="isRevokingApp" class="h-4 w-4 mr-2 animate-spin" />
          <Trash2 v-else class="h-4 w-4 mr-2" />
          {{ isRevokingApp ? t("userSettings.oauthAuthorizations.dialog.revoking") : t("userSettings.oauthAuthorizations.dialog.revoke") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog v-model:open="showDeviceRevokeDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("userSettings.oauthAuthorizations.deviceDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            t("userSettings.oauthAuthorizations.deviceDialog.description", {
              label: deviceRevokeTarget ? deviceName(deviceRevokeTarget) : '',
              clientName: deviceRevokeTarget?.clientName || deviceRevokeTarget?.clientId || '',
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          {{ t("userSettings.common.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" :disabled="isRevoking" @click="handleDeviceRevoke">
          <Loader2 v-if="revokingDeviceId" class="h-4 w-4 mr-2 animate-spin" />
          <Trash2 v-else class="h-4 w-4 mr-2" />
          {{ revokingDeviceId ? t("userSettings.oauthAuthorizations.dialog.revoking") : t("userSettings.oauthAuthorizations.devices.revoke") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
