<script setup lang="ts">
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
  LucideCheckCircle2,
  LucideCable,
  LucideCopy,
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

function formatCreatedDate(value: string) {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("adminOAuthClients.common.fallback"))
}

function resolveClientStatus(client: OAuthClient) {
  if (client.deleted) return t("adminOAuthClients.status.deleted")
  return client.active
    ? t("adminOAuthClients.status.enabled")
    : t("adminOAuthClients.status.disabled")
}

function resolveRedirectUris(client: OAuthClient): string[] {
  if ((client.redirectUris?.length ?? 0) > 0) return client.redirectUris ?? []
  return client.redirectUri ? [client.redirectUri] : []
}

function statusRailClass(client: OAuthClient) {
  if (client.deleted) return "border-l-destructive/60"
  return client.active ? "border-l-emerald-500/70" : "border-l-muted-foreground/30"
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
</script>

<template>
  <div class="grid gap-3 xl:grid-cols-2">
    <article
      v-for="client in props.clients"
      :key="client.clientId"
      :class="[
        'flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-4 transition-colors',
        statusRailClass(client),
        client.deleted ? 'opacity-75' : '',
      ]"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 class="truncate text-sm font-semibold">
              {{ client.name || t("adminOAuthClients.common.fallback") }}
            </h3>
            <span class="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {{ client.clientType === "public" ? t("adminOAuthClients.list.typePublic") : t("adminOAuthClients.list.typeConfidential") }}
            </span>
            <span
              :class="[
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                client.deleted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : client.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
              ]"
            >
              <LucideTrash2 v-if="client.deleted" class="h-3 w-3" />
              <LucideCheckCircle2 v-else-if="client.active" class="h-3 w-3" />
              <LucideBan v-else class="h-3 w-3" />
              {{ resolveClientStatus(client) }}
            </span>
          </div>
          <div class="mt-1.5 flex items-center gap-1">
            <code class="truncate rounded bg-muted px-1.5 py-0.5 text-xs">{{ client.clientId }}</code>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              :title="t('adminOAuthClients.list.copyClientId')"
              :aria-label="t('adminOAuthClients.list.copyClientId')"
              @click="copyClientId(client.clientId)"
            >
              <LucideCopy class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div class="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            class="hidden h-8 w-8 md:inline-flex"
            :disabled="props.actionLoading"
            :title="t('adminOAuthClients.table.menu.edit')"
            :aria-label="t('adminOAuthClients.table.menu.edit')"
            @click="emit('open-edit', client)"
          >
            <LucidePencil class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="hidden h-8 w-8 md:inline-flex"
            :disabled="props.actionLoading"
            :title="t('adminOAuthClients.table.menu.stats')"
            :aria-label="t('adminOAuthClients.table.menu.stats')"
            @click="emit('show-stats', client.clientId)"
          >
            <LucideBarChart3 class="h-4 w-4" />
          </Button>
          <Button
            v-if="props.isSuperAdmin"
            variant="ghost"
            size="icon"
            class="hidden h-8 w-8 md:inline-flex"
            :disabled="props.actionLoading || client.deleted"
            :title="t('adminOAuthClients.table.menu.webhooks')"
            :aria-label="t('adminOAuthClients.table.menu.webhooks')"
            @click="emit('manage-webhooks', client.clientId)"
          >
            <LucideCable class="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :title="t('adminOAuthClients.table.openMenu')"
                :aria-label="t('adminOAuthClients.table.openMenu')"
              >
                <LucideMoreHorizontal class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{{ t("adminOAuthClients.table.actions") }}</DropdownMenuLabel>
              <DropdownMenuItem class="md:hidden" :disabled="props.actionLoading" @click="emit('open-edit', client)">
                <LucidePencil class="mr-2 h-4 w-4" />
                {{ t("adminOAuthClients.table.menu.edit") }}
              </DropdownMenuItem>
              <DropdownMenuItem class="md:hidden" :disabled="props.actionLoading" @click="emit('show-stats', client.clientId)">
                <LucideBarChart3 class="mr-2 h-4 w-4" />
                {{ t("adminOAuthClients.table.menu.stats") }}
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="props.isSuperAdmin"
                class="md:hidden"
                :disabled="props.actionLoading || client.deleted"
                @click="emit('manage-webhooks', client.clientId)"
              >
                <LucideCable class="mr-2 h-4 w-4" />
                {{ t("adminOAuthClients.table.menu.webhooks") }}
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="props.actionLoading" @click="emit('toggle-active', client)">
                <LucidePower class="mr-2 h-4 w-4" />
                {{ client.active ? t("adminOAuthClients.table.menu.disableClient") : t("adminOAuthClients.table.menu.enableClient") }}
              </DropdownMenuItem>

              <template v-if="props.isSuperAdmin">
                <DropdownMenuSeparator />
                <DropdownMenuLabel class="text-xs text-muted-foreground">
                  {{ t("adminOAuthClients.table.menu.dangerZone") }}
                </DropdownMenuLabel>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('rotate-secret', client.clientId)">
                  <LucideKey class="mr-2 h-4 w-4" />
                  {{ t("adminOAuthClients.table.menu.rotateSecret") }}
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('revoke', client.clientId)">
                  <LucideRefreshCw class="mr-2 h-4 w-4" />
                  {{ t("adminOAuthClients.table.menu.revokeAll") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-if="client.deleted"
                  :disabled="props.actionLoading"
                  @click="emit('restore', client.clientId)"
                >
                  <LucideUndo2 class="mr-2 h-4 w-4" />
                  {{ t("adminOAuthClients.table.menu.restore") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  v-else
                  class="text-destructive focus:text-destructive"
                  :disabled="props.actionLoading"
                  @click="emit('confirm-delete', client.clientId)"
                >
                  <LucideTrash2 class="mr-2 h-4 w-4" />
                  {{ t("adminOAuthClients.table.menu.deleteClient") }}
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        <template v-if="(client.scopes?.length ?? 0) > 0">
          <code
            v-for="scope in client.scopes"
            :key="scope"
            class="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {{ scope }}
          </code>
        </template>
        <span v-else class="text-[11px] text-muted-foreground/70">
          {{ t("adminOAuthClients.list.noScopes") }}
        </span>
      </div>

      <div class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span :title="resolveRedirectUris(client).join('\n')">
          {{ t("adminOAuthClients.list.redirectUriCount", { count: resolveRedirectUris(client).length }, resolveRedirectUris(client).length) }}
        </span>
        <span class="tabular-nums">
          {{ t("adminOAuthClients.list.createdAt", { date: formatCreatedDate(client.createdAt) }) }}
        </span>
      </div>
    </article>
  </div>
</template>
