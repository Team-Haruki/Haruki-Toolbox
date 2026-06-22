<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideTrash2,
} from "lucide-vue-next"
import { formatLocalizedDate } from "@/lib/date-time"
import type { OAuthClientWebhook } from "@/types/admin"

const props = defineProps<{
  open: boolean
  clientId: string
  loading: boolean
  saving: boolean
  deleting: boolean
  formOpen: boolean
  editingWebhook: OAuthClientWebhook | null
  webhooks: OAuthClientWebhook[]
  callbackUrl: string
  bearer: string
  enabled: boolean
  clearBearer: boolean
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:form-open", value: boolean): void
  (event: "update:callback-url", value: string): void
  (event: "update:bearer", value: string): void
  (event: "update:enabled", value: boolean): void
  (event: "update:clear-bearer", value: boolean): void
  (event: "refresh"): void
  (event: "create"): void
  (event: "edit", webhook: OAuthClientWebhook): void
  (event: "delete", webhook: OAuthClientWebhook): void
  (event: "save"): void
}>()

const { t } = useI18n()
const formTitle = computed(() =>
  props.editingWebhook
    ? t("adminOAuthClients.webhooks.form.editTitle")
    : t("adminOAuthClients.webhooks.form.createTitle")
)

function formatDate(value: string | undefined) {
  return value
    ? formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("adminOAuthClients.common.fallback"))
    : t("adminOAuthClients.common.fallback")
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.webhooks.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminOAuthClients.webhooks.description", { clientId: props.clientId }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-sm text-muted-foreground">
          {{ t("adminOAuthClients.webhooks.placeholderHint") }}
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
            <LucideRefreshCw class="h-4 w-4" />
            {{ t("adminOAuthClients.webhooks.actions.refresh") }}
          </Button>
          <Button size="sm" @click="emit('create')">
            <LucidePlus class="h-4 w-4" />
            {{ t("adminOAuthClients.webhooks.actions.create") }}
          </Button>
        </div>
      </div>

      <div v-if="props.loading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
      </div>
      <div v-else class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminOAuthClients.webhooks.table.callbackUrl") }}</TableHead>
              <TableHead>{{ t("adminOAuthClients.webhooks.table.bearer") }}</TableHead>
              <TableHead>{{ t("adminOAuthClients.webhooks.table.status") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminOAuthClients.webhooks.table.createdAt") }}</TableHead>
              <TableHead>{{ t("adminOAuthClients.webhooks.table.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="webhook in props.webhooks" :key="webhook.id">
              <TableCell class="max-w-[280px]">
                <div class="flex flex-col gap-1">
                  <code class="truncate text-xs">{{ webhook.callbackUrl }}</code>
                  <span class="text-xs text-muted-foreground">{{ webhook.id }}</span>
                </div>
              </TableCell>
              <TableCell>
                <span class="text-sm">
                  {{ webhook.bearerSet ? t("adminOAuthClients.webhooks.bearer.configured") : t("adminOAuthClients.webhooks.bearer.empty") }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    webhook.enabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  {{ webhook.enabled ? t("adminOAuthClients.status.enabled") : t("adminOAuthClients.status.disabled") }}
                </span>
              </TableCell>
              <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                {{ formatDate(webhook.createdAt) }}
              </TableCell>
              <TableCell>
                <div class="flex gap-1">
                  <Button variant="ghost" size="icon" :disabled="props.saving" @click="emit('edit', webhook)">
                    <LucidePencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive"
                    :disabled="props.deleting"
                    @click="emit('delete', webhook)"
                  >
                    <LucideTrash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="props.webhooks.length === 0">
              <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">
                {{ t("adminOAuthClients.webhooks.table.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog :open="props.formOpen" @update:open="emit('update:form-open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ formTitle }}</DialogTitle>
        <DialogDescription>{{ t("adminOAuthClients.webhooks.form.description") }}</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-2">
        <div class="space-y-1.5">
          <Label>{{ t("adminOAuthClients.webhooks.form.callbackUrl") }}</Label>
          <Input
            :model-value="props.callbackUrl"
            :placeholder="t('adminOAuthClients.webhooks.form.callbackUrlPlaceholder')"
            @update:model-value="emit('update:callback-url', String($event ?? ''))"
          />
        </div>
        <div class="space-y-1.5">
          <Label>{{ t("adminOAuthClients.webhooks.form.bearer") }}</Label>
          <Input
            type="password"
            :model-value="props.bearer"
            :disabled="props.saving || props.clearBearer"
            :placeholder="props.editingWebhook?.bearerSet ? t('adminOAuthClients.webhooks.form.bearerReplacePlaceholder') : t('adminOAuthClients.webhooks.form.bearerPlaceholder')"
            @update:model-value="emit('update:bearer', String($event ?? ''))"
          />
          <p class="text-xs text-muted-foreground">
            {{ t("adminOAuthClients.webhooks.form.bearerHelp") }}
          </p>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <Label>{{ t("adminOAuthClients.webhooks.form.enabled") }}</Label>
            <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.webhooks.form.enabledHelp") }}</p>
          </div>
          <Switch :model-value="props.enabled" @update:model-value="emit('update:enabled', Boolean($event))" />
        </div>
        <div v-if="props.editingWebhook?.bearerSet" class="flex items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <Label>{{ t("adminOAuthClients.webhooks.form.clearBearer") }}</Label>
            <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.webhooks.form.clearBearerHelp") }}</p>
          </div>
          <Switch :model-value="props.clearBearer" @update:model-value="emit('update:clear-bearer', Boolean($event))" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:form-open', false)">
          {{ t("adminOAuthClients.webhooks.actions.cancel") }}
        </Button>
        <Button :disabled="props.saving" @click="emit('save')">
          {{ t("adminOAuthClients.webhooks.actions.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
