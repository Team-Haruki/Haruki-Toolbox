<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LucideExternalLink,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideUsers,
  LucideWebhook,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import AdminWebhookStatusBadge from "./AdminWebhookStatusBadge.vue"
import type { AdminWebhookEndpoint } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  endpointsLoading: boolean
  endpoints: AdminWebhookEndpoint[]
  endpointsGeneratedAt: string
  endpointsTotal: number
  formatDate: (value?: string) => string
}>()

const emit = defineEmits<{
  (event: "create"): void
  (event: "open-subscribers", webhook: AdminWebhookEndpoint): void
  (event: "open-edit", webhook: AdminWebhookEndpoint): void
  (event: "confirm-delete", webhook: AdminWebhookEndpoint): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <CardTitle class="text-lg">{{ t("adminWebhooks.list.title") }}</CardTitle>
        <CardDescription>{{ t("adminWebhooks.list.description") }}</CardDescription>
      </div>
      <Button v-if="props.canMutate" class="shrink-0" @click="emit('create')">
        <LucidePlus class="w-4 h-4 mr-2" />
        {{ t("adminWebhooks.actions.create") }}
      </Button>
    </CardHeader>
    <CardContent class="p-0">
      <template v-if="props.endpointsLoading || props.endpoints.length > 0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminWebhooks.table.id") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.table.callbackUrl") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminWebhooks.table.credential") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.table.status") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminWebhooks.table.subscriptions") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminWebhooks.table.createdAt") }}</TableHead>
              <TableHead class="text-right">{{ t("adminWebhooks.table.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="props.endpointsLoading">
              <TableRow v-for="row in 4" :key="row">
                <TableCell colspan="7">
                  <Skeleton class="h-8 w-full" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow v-for="webhook in props.endpoints" :key="webhook.id">
                <TableCell class="max-w-[100px] md:max-w-none">
                  <code class="text-xs bg-muted px-1.5 py-0.5 rounded truncate block w-fit max-w-full">{{ webhook.id }}</code>
                </TableCell>
                <TableCell class="max-w-[150px] md:max-w-xs lg:max-w-sm xl:max-w-md">
                  <a
                    :href="webhook.callbackUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex items-center gap-1 text-primary hover:underline text-sm max-w-full"
                  >
                    <span class="truncate">{{ webhook.callbackUrl }}</span>
                    <LucideExternalLink class="w-3.5 h-3.5 shrink-0" />
                  </a>
                </TableCell>
                <TableCell class="hidden md:table-cell font-mono text-xs max-w-[150px] truncate" :title="webhook.credential">
                  {{ webhook.credential }}
                </TableCell>
                <TableCell>
                  <AdminWebhookStatusBadge
                    :active="webhook.enabled"
                    :label="webhook.enabled ? t('adminWebhooks.status.enabled') : t('adminWebhooks.status.disabled')"
                  />
                </TableCell>
                <TableCell class="hidden lg:table-cell text-sm font-medium tabular-nums">{{ webhook.subscriptionCount }}</TableCell>
                <TableCell class="hidden lg:table-cell text-muted-foreground text-sm">{{ props.formatDate(webhook.createdAt) }}</TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        :title="t('adminWebhooks.table.actions')"
                        :aria-label="t('adminWebhooks.table.actions')"
                      >
                        <LucideMoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{{ t("adminWebhooks.table.actions") }}</DropdownMenuLabel>
                      <DropdownMenuItem @click="emit('open-subscribers', webhook)">
                        <LucideUsers class="w-4 h-4 mr-2" />
                        {{ t("adminWebhooks.actions.subscribers") }}
                      </DropdownMenuItem>
                      <template v-if="props.canMutate">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="emit('open-edit', webhook)">
                          <LucidePencil class="w-4 h-4 mr-2" />
                          {{ t("adminWebhooks.actions.edit") }}
                        </DropdownMenuItem>
                        <DropdownMenuItem class="text-destructive focus:text-destructive" @click="emit('confirm-delete', webhook)">
                          <LucideTrash2 class="w-4 h-4 mr-2" />
                          {{ t("adminWebhooks.actions.delete") }}
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>

        <div
          v-if="!props.endpointsLoading"
          class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-6 pt-4 text-xs text-muted-foreground"
        >
          <span class="tabular-nums">{{ t("adminWebhooks.list.total", { total: props.endpointsTotal }) }}</span>
          <span v-if="props.endpointsGeneratedAt">
            {{ t("adminWebhooks.list.generatedAt", { date: props.formatDate(props.endpointsGeneratedAt) }) }}
          </span>
        </div>
      </template>

      <div v-else class="px-6">
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <LucideWebhook class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.table.empty") }}</p>
          <Button v-if="props.canMutate" size="sm" @click="emit('create')">
            <LucidePlus class="w-4 h-4 mr-2" />
            {{ t("adminWebhooks.actions.create") }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
