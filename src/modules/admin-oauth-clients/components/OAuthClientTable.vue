<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucideBan,
  LucideBarChart3,
  LucideCheckCircle2,
  LucideKey,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePower,
  LucideRefreshCw,
  LucideTrash2,
  LucideUndo2,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { formatLocalizedDate } from "@/lib/date-time"
import type { OAuthClient } from "@/types/admin"

interface Props {
  loading: boolean
  clients: OAuthClient[]
  actionLoading: boolean
  isSuperAdmin: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "open-edit", client: OAuthClient): void
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
</script>

<template>
  <template v-if="props.loading">
    <div class="p-6 flex flex-col gap-3">
      <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>
  </template>
  <template v-else>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{{ t("adminOAuthClients.table.clientId") }}</TableHead>
          <TableHead>{{ t("adminOAuthClients.table.name") }}</TableHead>
          <TableHead class="hidden sm:table-cell">{{ t("adminOAuthClients.table.redirectUris") }}</TableHead>
          <TableHead>{{ t("adminOAuthClients.table.status") }}</TableHead>
          <TableHead class="hidden md:table-cell">{{ t("adminOAuthClients.table.createdAt") }}</TableHead>
          <TableHead>{{ t("adminOAuthClients.table.actions") }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="client in props.clients" :key="client.clientId">
          <TableCell>
            <div class="flex flex-col gap-1 items-start">
              <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ client.clientId }}</code>
              <span
                v-if="client.clientType === 'public'"
                class="text-[10px] text-muted-foreground bg-muted border px-1 rounded"
              >
                {{ t("adminOAuthClients.table.publicTag") }}
              </span>
            </div>
          </TableCell>
          <TableCell class="text-sm font-medium">
            {{ client.name || t("adminOAuthClients.common.fallback") }}
          </TableCell>
          <TableCell class="hidden sm:table-cell text-muted-foreground text-sm max-w-[200px]">
            <div v-if="(client.redirectUris?.length ?? 0) > 0" class="flex flex-col gap-0.5">
              <code v-for="(uri, i) in client.redirectUris" :key="i" class="text-xs truncate block">{{ uri }}</code>
            </div>
            <span v-else-if="client.redirectUri">{{ client.redirectUri }}</span>
            <span v-else class="text-muted-foreground">{{ t("adminOAuthClients.common.fallback") }}</span>
          </TableCell>
          <TableCell>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                client.deleted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : client.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
              ]"
            >
              <LucideTrash2 v-if="client.deleted" class="w-3.5 h-3.5" />
              <LucideCheckCircle2 v-else-if="client.active" class="w-3.5 h-3.5" />
              <LucideBan v-else class="w-3.5 h-3.5" />
              {{ resolveClientStatus(client) }}
            </span>
          </TableCell>
          <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
            {{ formatCreatedDate(client.createdAt) }}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0">
                  <span class="sr-only">{{ t("adminOAuthClients.table.openMenu") }}</span>
                  <LucideMoreHorizontal class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{{ t("adminOAuthClients.table.actions") }}</DropdownMenuLabel>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('open-edit', client)">
                  <LucidePencil class="w-4 h-4 mr-2" />
                  {{ t("adminOAuthClients.table.menu.edit") }}
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('show-stats', client.clientId)">
                  <LucideBarChart3 class="w-4 h-4 mr-2" />
                  {{ t("adminOAuthClients.table.menu.stats") }}
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="props.actionLoading" @click="emit('toggle-active', client)">
                  <LucidePower class="w-4 h-4 mr-2" />
                  {{ client.active ? t("adminOAuthClients.table.menu.disableClient") : t("adminOAuthClients.table.menu.enableClient") }}
                </DropdownMenuItem>

                <template v-if="props.isSuperAdmin">
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel class="text-xs text-muted-foreground">
                    {{ t("adminOAuthClients.table.menu.dangerZone") }}
                  </DropdownMenuLabel>
                  <DropdownMenuItem :disabled="props.actionLoading" @click="emit('rotate-secret', client.clientId)">
                    <LucideKey class="w-4 h-4 mr-2" />
                    {{ t("adminOAuthClients.table.menu.rotateSecret") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem :disabled="props.actionLoading" @click="emit('revoke', client.clientId)">
                    <LucideRefreshCw class="w-4 h-4 mr-2" />
                    {{ t("adminOAuthClients.table.menu.revokeAll") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="client.deleted"
                    :disabled="props.actionLoading"
                    @click="emit('restore', client.clientId)"
                  >
                    <LucideUndo2 class="w-4 h-4 mr-2" />
                    {{ t("adminOAuthClients.table.menu.restore") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-else
                    class="text-destructive focus:text-destructive"
                    :disabled="props.actionLoading"
                    @click="emit('confirm-delete', client.clientId)"
                  >
                    <LucideTrash2 class="w-4 h-4 mr-2" />
                    {{ t("adminOAuthClients.table.menu.deleteClient") }}
                  </DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        <TableRow v-if="props.clients.length === 0">
          <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">
            {{ t("adminOAuthClients.table.empty") }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </template>
</template>
