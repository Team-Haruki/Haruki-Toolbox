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
  LucideBan,
  LucideCheckCircle2,
  LucideExternalLink,
  LucideMoreHorizontal,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideUsers,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
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

function endpointStatusClass(enabled: boolean) {
  return enabled
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <CardTitle class="text-lg">{{ t("adminWebhooks.list.title") }}</CardTitle>
        <CardDescription>
          {{ t("adminWebhooks.list.description") }}
          <span v-if="props.endpointsGeneratedAt" class="block mt-1">
            {{ t("adminWebhooks.list.generatedAt", { date: props.formatDate(props.endpointsGeneratedAt) }) }}
          </span>
        </CardDescription>
      </div>
      <Button v-if="props.canMutate" @click="emit('create')">
        <LucidePlus class="w-4 h-4 mr-2" />
        {{ t("adminWebhooks.actions.create") }}
      </Button>
    </CardHeader>
    <CardContent class="p-0">
      <div class="px-6 pb-4 text-sm text-muted-foreground">
        {{ t("adminWebhooks.list.total", { total: props.endpointsTotal }) }}
      </div>
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminWebhooks.table.id") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.table.callbackUrl") }}</TableHead>
              <TableHead class="hidden sm:table-cell">{{ t("adminWebhooks.table.credential") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.table.status") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminWebhooks.table.subscriptions") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminWebhooks.table.createdAt") }}</TableHead>
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
            <template v-else-if="props.endpoints.length > 0">
              <TableRow v-for="webhook in props.endpoints" :key="webhook.id">
                <TableCell class="max-w-[100px] sm:max-w-none">
                  <code class="text-xs bg-muted px-1.5 py-0.5 rounded truncate block w-fit max-w-full">{{ webhook.id }}</code>
                </TableCell>
                <TableCell class="max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-md">
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
                <TableCell class="hidden sm:table-cell font-mono text-xs max-w-[150px] truncate" :title="webhook.credential">
                  {{ webhook.credential }}
                </TableCell>
                <TableCell>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      endpointStatusClass(webhook.enabled),
                    ]"
                  >
                    <LucideCheckCircle2 v-if="webhook.enabled" class="w-3.5 h-3.5" />
                    <LucideBan v-else class="w-3.5 h-3.5" />
                    {{ webhook.enabled ? t("adminWebhooks.status.enabled") : t("adminWebhooks.status.disabled") }}
                  </span>
                </TableCell>
                <TableCell class="hidden md:table-cell text-sm font-medium">{{ webhook.subscriptionCount }}</TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground text-sm">{{ props.formatDate(webhook.createdAt) }}</TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">{{ t("adminWebhooks.table.actions") }}</span>
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
            <TableRow v-else>
              <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                {{ t("adminWebhooks.table.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
