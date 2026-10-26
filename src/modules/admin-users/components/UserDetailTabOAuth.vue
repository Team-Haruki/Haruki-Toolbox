<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LucideKeyRound } from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { getScopeLabel } from "@/modules/user-settings/api"
import type { UserOAuthAuthorization } from "@/modules/admin-users/api/oauth"
import { formatDateTime } from "@/modules/admin-users/constants"

const props = defineProps<{
    loading: boolean
    busy: boolean
    authorizations: UserOAuthAuthorization[]
    /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
    revokeAll: () => Promise<void>
}>()

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

function statusKey(item: UserOAuthAuthorization): "revoked" | "clientDisabled" | "active" {
    if (item.revoked) return "revoked"
    if (item.clientActive === false) return "clientDisabled"
    return "active"
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between gap-2">
      <CardTitle>{{ t("adminUsers.detail.oauth.title") }}</CardTitle>
      <Button
        v-if="authorizations.length > 0"
        variant="destructive"
        size="sm"
        :disabled="busy"
        @click="requestRevokeAll"
      >
        {{ t("adminUsers.detail.oauth.revokeAll") }}
      </Button>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
      </template>
      <template v-else-if="authorizations.length > 0">
        <p class="mb-3 text-sm text-muted-foreground">
          {{ t("adminUsers.detail.oauth.total", { count: authorizations.length }) }}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminUsers.detail.oauth.columns.client") }}</TableHead>
              <TableHead>{{ t("adminUsers.detail.oauth.columns.scopes") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminUsers.detail.oauth.columns.createdAt") }}</TableHead>
              <TableHead>{{ t("adminUsers.detail.oauth.columns.status") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(item, index) in authorizations"
              :key="item.consentRequestId || item.authorizationId || `${item.clientId ?? 'client'}-${index}`"
            >
              <TableCell>
                <div class="flex min-w-0 flex-col">
                  <span class="text-sm font-medium break-words">{{ item.clientName || item.clientId || fallback }}</span>
                  <span v-if="item.clientName && item.clientId" class="font-mono text-xs text-muted-foreground break-all">
                    {{ item.clientId }}
                  </span>
                  <span v-if="item.clientType" class="text-xs text-muted-foreground">{{ item.clientType }}</span>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="scopeLabels(item).length > 0" class="flex max-w-[320px] flex-wrap gap-1">
                  <span
                    v-for="(label, scopeIndex) in scopeLabels(item)"
                    :key="`${label}-${scopeIndex}`"
                    class="rounded bg-muted px-1.5 py-0.5 text-xs"
                  >
                    {{ label }}
                  </span>
                </div>
                <span v-else class="text-sm text-muted-foreground">{{ fallback }}</span>
              </TableCell>
              <TableCell class="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                {{ grantedAt(item) }}
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                    statusKey(item) === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  {{ t(`adminUsers.detail.oauth.status.${statusKey(item)}`) }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <LucideKeyRound class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.oauth.empty") }}</p>
        </div>
      </template>
    </CardContent>

    <ConfirmDialog
      v-model:open="revokeConfirmOpen"
      :title="t('adminUsers.detail.oauth.revokeAllDialogTitle')"
      :description="t('adminUsers.detail.oauth.revokeAllDialogDescription', { count: revokeCount })"
      :cancel-label="t('adminUsers.common.cancel')"
      :confirm-label="t('adminUsers.detail.oauth.revokeAll')"
      destructive
      :on-confirm="props.revokeAll"
    />
  </Card>
</template>
