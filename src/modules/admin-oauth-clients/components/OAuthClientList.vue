<script setup lang="ts">
/**
 * The client list: one row per client inside the page's bordered panel. On a
 * wide panel the rows read as a table (client, scopes, redirect URIs,
 * created, actions) under a header line; on a narrow one each row stacks the
 * same parts under small labels. The fold follows the panel's own width,
 * because the page sits beside the admin navigation.
 */
import { computed, useTemplateRef } from "vue"
import { useElementSize } from "@vueuse/core"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LucideBan,
  LucideBarChart3,
  LucideBot,
  LucideCable,
  LucideCheckCircle2,
  LucideCopy,
  LucideGlobe,
  LucideKey,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePower,
  LucideRefreshCw,
  LucideTrash2,
  LucideUndo2,
} from "lucide-vue-next"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { formatLocalizedDate } from "@/lib/date-time"
import type { OAuthClient } from "@/types/admin"
import { canRotateClientSecret } from "@/modules/admin-oauth-clients/lib/client-actions"
import { WRITE_SCOPE_IDS } from "@/modules/admin-oauth-clients/lib/form"
import { GRANT_TYPE_DEVICE_CODE } from "@/modules/admin-oauth-clients/lib/grant-types"

interface Props {
  clients: OAuthClient[]
  actionLoading: boolean
  isSuperAdmin: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "open-edit", client: OAuthClient): void
  (event: "manage-webhooks", clientId: string): void
  (event: "show-stats", clientId: string): void
  (event: "toggle-active", client: OAuthClient): void
  (event: "rotate-secret", clientId: string): void
  (event: "revoke", clientId: string): void
  (event: "restore", clientId: string): void
  (event: "confirm-delete", clientId: string): void
}>()

/** Redirect URIs listed in a row before the rest folds into "+N more". */
const VISIBLE_REDIRECT_URIS = 2

// The row menu is rendered outside the list, so it cannot follow the list's
// container width in CSS: on a narrow list the edit and webhook buttons move
// into the menu, decided here from the measured width (0 before mount).
const listElement = useTemplateRef<HTMLElement>("list")
const { width: listWidth } = useElementSize(listElement)
const compact = computed(() => listWidth.value > 0 && listWidth.value < 448)

function formatCreatedDate(value: string) {
  return formatLocalizedDate(value, "date", t("adminOAuthClients.common.fallback"))
}

function resolveClientStatus(client: OAuthClient) {
  if (client.deleted) return t("adminOAuthClients.status.deleted")
  return client.active
    ? t("adminOAuthClients.status.enabled")
    : t("adminOAuthClients.status.disabled")
}

function statusChipClass(client: OAuthClient) {
  if (client.deleted) return "bg-destructive/15 text-destructive-tint-foreground"
  return client.active
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    : "bg-muted text-muted-foreground"
}

function resolveRedirectUris(client: OAuthClient): string[] {
  if ((client.redirectUris?.length ?? 0) > 0) return client.redirectUris ?? []
  return client.redirectUri ? [client.redirectUri] : []
}

/** Grant types as the short names admins type, not the device grant's URN. */
function grantTypeNames(client: OAuthClient): string {
  return (client.grantTypes ?? [])
    .map((grantType) => (grantType === GRANT_TYPE_DEVICE_CODE ? "device_code" : grantType))
    .join(" · ")
}

async function copyClientId(clientId: string) {
  if (!isClipboardSupported()) {
    toast.error(t("adminOAuthClients.toast.copyFailedTitle"), {
      description: t("adminOAuthClients.toast.copyFailedClipboardUnsupported"),
    })
    return
  }
  if (await copyTextToClipboard(clientId)) {
    toast.success(t("adminOAuthClients.toast.copied"))
    return
  }
  toast.error(t("adminOAuthClients.toast.copyFailedTitle"))
}

const ICON_BUTTON = "size-8 shrink-0 pointer-coarse:size-10"
</script>

<template>
  <div ref="list" class="@container" data-slot="oauth-client-list">
    <div
      class="hidden items-center gap-x-4 border-b border-border/60 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground @min-[52rem]:flex"
      aria-hidden="true"
    >
      <span class="w-56 shrink-0">{{ t("adminOAuthClients.list.columns.client") }}</span>
      <span class="min-w-0 flex-[1.3]">{{ t("adminOAuthClients.list.columns.scopes") }}</span>
      <span class="min-w-0 flex-[1.1]">{{ t("adminOAuthClients.list.columns.redirectUris") }}</span>
      <span class="w-24 shrink-0">{{ t("adminOAuthClients.list.columns.createdAt") }}</span>
      <span class="w-[8.5rem] shrink-0 text-right pointer-coarse:w-[10.5rem]">{{ t("adminOAuthClients.table.actions") }}</span>
    </div>

    <div class="divide-y divide-border/60">
      <article
        v-for="client in props.clients"
        :key="client.clientId"
        :class="[
          'relative flex flex-wrap items-start gap-x-4 gap-y-2.5 px-4 py-3',
          client.deleted ? 'bg-muted/20' : '',
        ]"
        :data-client-id="client.clientId"
      >
        <!-- Who: icon, name, chips, id. Leaves room for the actions pinned top right on a narrow panel. -->
        <div
          :class="[
            'flex min-w-0 basis-full items-start gap-3 @min-[52rem]:w-56 @min-[52rem]:shrink-0 @min-[52rem]:basis-auto @min-[52rem]:pr-0!',
            compact ? 'pr-20 pointer-coarse:pr-24' : 'pr-36 pointer-coarse:pr-44',
          ]"
        >
          <span
            :class="[
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
              client.deleted || !client.active ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
            ]"
            aria-hidden="true"
          >
            <LucideGlobe v-if="client.clientType === 'public'" class="size-4" />
            <LucideBot v-else class="size-4" />
          </span>
          <div class="min-w-0 flex-1">
            <h3 :class="['text-sm font-medium [overflow-wrap:anywhere]', client.deleted ? 'text-muted-foreground line-through' : '']">
              {{ client.name || t("adminOAuthClients.common.fallback") }}
            </h3>
            <div class="mt-1 flex flex-wrap items-center gap-1">
              <span
                :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', statusChipClass(client)]"
              >
                <LucideTrash2 v-if="client.deleted" class="size-3" aria-hidden="true" />
                <LucideCheckCircle2 v-else-if="client.active" class="size-3" aria-hidden="true" />
                <LucideBan v-else class="size-3" aria-hidden="true" />
                {{ resolveClientStatus(client) }}
              </span>
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {{ client.clientType === "public" ? t("adminOAuthClients.list.typePublic") : t("adminOAuthClients.list.typeConfidential") }}
              </span>
              <span
                v-if="client.deviceEnabled"
                class="inline-flex items-center rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300"
                :title="t('adminOAuthClients.list.deviceBadgeTitle')"
              >
                {{ t("adminOAuthClients.list.deviceBadge") }}
              </span>
            </div>
            <div class="mt-1 flex min-w-0 items-center gap-0.5">
              <code class="min-w-0 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ client.clientId }}</code>
              <Button
                variant="ghost"
                size="icon"
                class="size-6 shrink-0 text-muted-foreground hover:text-foreground pointer-coarse:size-10"
                :title="t('adminOAuthClients.list.copyClientId')"
                :aria-label="t('adminOAuthClients.list.copyClientId')"
                @click="copyClientId(client.clientId)"
              >
                <LucideCopy class="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <!-- What it may do: scopes as chips (write scopes tinted), grant types under them. -->
        <div class="min-w-0 basis-full pl-11 @min-[52rem]:flex-[1.3] @min-[52rem]:basis-0 @min-[52rem]:pl-0">
          <p class="mb-1 text-[11px] text-muted-foreground @min-[52rem]:hidden">{{ t("adminOAuthClients.list.columns.scopes") }}</p>
          <ul v-if="(client.scopes?.length ?? 0) > 0" class="flex flex-wrap gap-1" role="list">
            <li
              v-for="scope in client.scopes"
              :key="scope"
              :class="[
                'rounded-full px-2 py-0.5 font-mono text-[11px]',
                WRITE_SCOPE_IDS.has(scope)
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  : 'bg-secondary text-secondary-foreground',
              ]"
              :title="WRITE_SCOPE_IDS.has(scope) ? t('adminOAuthClients.form.writeScopeHint') : undefined"
            >
              {{ scope }}
            </li>
          </ul>
          <p v-else class="text-xs text-muted-foreground">{{ t("adminOAuthClients.list.noScopes") }}</p>
          <p v-if="(client.grantTypes?.length ?? 0) > 0" class="mt-1 font-mono text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
            {{ grantTypeNames(client) }}
          </p>
        </div>

        <!-- Where it sends users back to. -->
        <div class="min-w-0 basis-full pl-11 @min-[52rem]:flex-[1.1] @min-[52rem]:basis-0 @min-[52rem]:pl-0">
          <p v-if="resolveRedirectUris(client).length > 0" class="mb-1 text-[11px] text-muted-foreground @min-[52rem]:hidden">
            {{ t("adminOAuthClients.list.redirectUriCount", { count: resolveRedirectUris(client).length }, resolveRedirectUris(client).length) }}
          </p>
          <ul v-if="resolveRedirectUris(client).length > 0" class="flex flex-col gap-0.5" role="list">
            <li
              v-for="uri in resolveRedirectUris(client).slice(0, VISIBLE_REDIRECT_URIS)"
              :key="uri"
              class="line-clamp-3 text-xs text-muted-foreground [overflow-wrap:anywhere]"
              :title="uri"
            >
              {{ uri }}
            </li>
            <li
              v-if="resolveRedirectUris(client).length > VISIBLE_REDIRECT_URIS"
              class="text-xs text-muted-foreground"
              :title="resolveRedirectUris(client).slice(VISIBLE_REDIRECT_URIS).join('\n')"
            >
              {{ t("adminOAuthClients.list.moreRedirectUris", { count: resolveRedirectUris(client).length - VISIBLE_REDIRECT_URIS }) }}
            </li>
          </ul>
          <p v-else class="text-xs text-muted-foreground">{{ t("adminOAuthClients.list.noRedirectUris") }}</p>
        </div>

        <div class="basis-full pl-11 text-xs tabular-nums text-muted-foreground @min-[52rem]:w-24 @min-[52rem]:shrink-0 @min-[52rem]:basis-auto @min-[52rem]:pl-0 @min-[52rem]:pt-0.5">
          <span class="@min-[52rem]:hidden">{{ t("adminOAuthClients.list.createdAt", { date: formatCreatedDate(client.createdAt) }) }}</span>
          <span class="hidden @min-[52rem]:inline">{{ formatCreatedDate(client.createdAt) }}</span>
        </div>

        <div class="absolute top-2.5 right-2 flex shrink-0 items-center justify-end @min-[52rem]:static @min-[52rem]:-my-0.5 @min-[52rem]:w-[8.5rem] pointer-coarse:@min-[52rem]:w-[10.5rem]">
          <Button
            v-if="!compact"
            variant="ghost"
            size="icon"
            :class="ICON_BUTTON"
            :disabled="props.actionLoading"
            :title="t('adminOAuthClients.table.menu.edit')"
            :aria-label="t('adminOAuthClients.table.menu.edit')"
            @click="emit('open-edit', client)"
          >
            <LucidePencil class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            :class="ICON_BUTTON"
            :disabled="props.actionLoading"
            :title="t('adminOAuthClients.table.menu.stats')"
            :aria-label="t('adminOAuthClients.table.menu.stats')"
            @click="emit('show-stats', client.clientId)"
          >
            <LucideBarChart3 class="size-4" />
          </Button>
          <Button
            v-if="props.isSuperAdmin && !compact"
            variant="ghost"
            size="icon"
            :class="ICON_BUTTON"
            :disabled="props.actionLoading || client.deleted"
            :title="t('adminOAuthClients.table.menu.webhooks')"
            :aria-label="t('adminOAuthClients.table.menu.webhooks')"
            @click="emit('manage-webhooks', client.clientId)"
          >
            <LucideCable class="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                :class="ICON_BUTTON"
                :title="t('adminOAuthClients.table.openMenu')"
                :aria-label="t('adminOAuthClients.table.openMenu')"
              >
                <LucideMoreHorizontal class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{{ t("adminOAuthClients.table.actions") }}</DropdownMenuLabel>
              <DropdownMenuItem v-if="compact" :disabled="props.actionLoading" @click="emit('open-edit', client)">
                <LucidePencil class="mr-2 size-4" />
                {{ t("adminOAuthClients.table.menu.edit") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="props.isSuperAdmin && compact"
                :disabled="props.actionLoading || client.deleted"
                @click="emit('manage-webhooks', client.clientId)"
              >
                <LucideCable class="mr-2 size-4" />
                {{ t("adminOAuthClients.table.menu.webhooks") }}
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="props.actionLoading" @click="emit('toggle-active', client)">
                <LucidePower class="mr-2 size-4" />
                {{ client.active ? t("adminOAuthClients.table.menu.disableClient") : t("adminOAuthClients.table.menu.enableClient") }}
              </DropdownMenuItem>

              <template v-if="props.isSuperAdmin">
                <DropdownMenuSeparator />
                <DropdownMenuLabel class="text-xs text-muted-foreground">
                  {{ t("adminOAuthClients.table.menu.dangerZone") }}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  v-if="canRotateClientSecret(client)"
                  :disabled="props.actionLoading"
                  @click="emit('rotate-secret', client.clientId)"
                >
                  <LucideKey class="mr-2 size-4" />
                  {{ t("adminOAuthClients.table.menu.rotateSecret") }}
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('revoke', client.clientId)">
                  <LucideRefreshCw class="mr-2 size-4" />
                  {{ t("adminOAuthClients.table.menu.revokeAll") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="client.deleted"
                  :disabled="props.actionLoading"
                  @click="emit('restore', client.clientId)"
                >
                  <LucideUndo2 class="mr-2 size-4" />
                  {{ t("adminOAuthClients.table.menu.restore") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-else
                  class="text-destructive focus:text-destructive"
                  :disabled="props.actionLoading"
                  @click="emit('confirm-delete', client.clientId)"
                >
                  <LucideTrash2 class="mr-2 size-4" />
                  {{ t("adminOAuthClients.table.menu.deleteClient") }}
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>
    </div>
  </div>
</template>
