<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
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
  LucideBan,
  LucideCable,
  LucideCheckCircle2,
  LucideKeyRound,
  LucideEraser,
  LucidePencil,
  LucidePlus,
  LucidePower,
  LucideRefreshCw,
  LucideTrash2,
} from "lucide-vue-next"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
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

const enabledCount = computed(() => props.webhooks.filter((webhook) => webhook.enabled).length)

function formatDate(value: string | undefined) {
  return value
    ? formatLocalizedDate(value, "date", t("adminOAuthClients.common.fallback"))
    : t("adminOAuthClients.common.fallback")
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.webhooks.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminOAuthClients.webhooks.description", { clientId: props.clientId }) }}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p class="min-w-0 flex-1 basis-56 text-xs text-muted-foreground">
            {{ t("adminOAuthClients.webhooks.placeholderHint") }}
          </p>
          <div class="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
              <LucideRefreshCw :class="['size-4', props.loading ? 'animate-spin' : '']" />
              {{ t("adminOAuthClients.webhooks.actions.refresh") }}
            </Button>
            <Button size="sm" @click="emit('create')">
              <LucidePlus class="size-4" />
              {{ t("adminOAuthClients.webhooks.actions.create") }}
            </Button>
          </div>
        </div>

        <div v-if="props.loading" class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
          <div v-for="i in 3" :key="i" class="space-y-2 px-4 py-3">
            <Skeleton class="h-4 w-72 max-w-full" />
            <Skeleton class="h-3 w-40 max-w-full" />
          </div>
        </div>
        <div
          v-else-if="props.webhooks.length === 0"
          class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-4 py-10 text-center"
        >
          <LucideCable class="size-8 text-muted-foreground/60" aria-hidden="true" />
          <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.webhooks.table.empty") }}</p>
          <Button size="sm" @click="emit('create')">
            <LucidePlus class="size-4" />
            {{ t("adminOAuthClients.webhooks.actions.create") }}
          </Button>
        </div>
        <div v-else class="min-w-0 overflow-hidden rounded-xl border bg-card">
          <p class="border-b border-border/60 bg-muted/30 px-4 py-2 text-xs tabular-nums text-muted-foreground">
            {{ t("adminOAuthClients.webhooks.summary", { total: props.webhooks.length, enabled: enabledCount }) }}
          </p>
          <ul class="divide-y divide-border/60" role="list">
            <li
              v-for="webhook in props.webhooks"
              :key="webhook.id"
              class="flex items-start gap-3 px-4 py-3"
              data-testid="oauth-client-webhook-row"
            >
              <div class="min-w-0 flex-1">
                <p class="font-mono text-xs [overflow-wrap:anywhere]">{{ webhook.callbackUrl }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      webhook.enabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground',
                    ]"
                  >
                    <LucideCheckCircle2 v-if="webhook.enabled" class="size-3" aria-hidden="true" />
                    <LucideBan v-else class="size-3" aria-hidden="true" />
                    {{ webhook.enabled ? t("adminOAuthClients.status.enabled") : t("adminOAuthClients.status.disabled") }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <LucideKeyRound class="size-3" aria-hidden="true" />
                    {{ t("adminOAuthClients.webhooks.table.bearer") }}
                    {{ webhook.bearerSet ? t("adminOAuthClients.webhooks.bearer.configured") : t("adminOAuthClients.webhooks.bearer.empty") }}
                  </span>
                  <span class="text-xs tabular-nums text-muted-foreground">
                    {{ t("adminOAuthClients.list.createdAt", { date: formatDate(webhook.createdAt) }) }}
                  </span>
                </div>
                <p class="mt-1 font-mono text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{{ webhook.id }}</p>
              </div>
              <div class="-mr-2 flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 pointer-coarse:size-10"
                  :disabled="props.saving"
                  :title="t('adminOAuthClients.table.menu.edit')"
                  :aria-label="t('adminOAuthClients.table.menu.edit')"
                  @click="emit('edit', webhook)"
                >
                  <LucidePencil class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
                  :disabled="props.deleting"
                  :title="t('adminOAuthClients.webhooks.deleteDialog.confirm')"
                  :aria-label="t('adminOAuthClients.webhooks.deleteDialog.confirm')"
                  @click="emit('delete', webhook)"
                >
                  <LucideTrash2 class="size-4" />
                </Button>
              </div>
            </li>
          </ul>
        </div>
      </DialogBody>
    </DialogContent>
  </Dialog>

  <Dialog :open="props.formOpen" @update:open="emit('update:form-open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ formTitle }}</DialogTitle>
        <DialogDescription>{{ t("adminOAuthClients.webhooks.form.description") }}</DialogDescription>
      </DialogHeader>
      <DialogBody>
        <SettingsGroup>
          <div class="grid gap-1.5 px-4 py-3">
            <Label for="oauth-webhook-callback-url">{{ t("adminOAuthClients.webhooks.form.callbackUrl") }}</Label>
            <Input
              id="oauth-webhook-callback-url"
              class="bg-background"
              :model-value="props.callbackUrl"
              :placeholder="t('adminOAuthClients.webhooks.form.callbackUrlPlaceholder')"
              @update:model-value="emit('update:callback-url', String($event ?? ''))"
            />
          </div>
          <div class="grid gap-1.5 px-4 py-3">
            <Label for="oauth-webhook-bearer">{{ t("adminOAuthClients.webhooks.form.bearer") }}</Label>
            <Input
              id="oauth-webhook-bearer"
              type="password"
              class="bg-background"
              :model-value="props.bearer"
              :disabled="props.saving || props.clearBearer"
              :placeholder="props.editingWebhook?.bearerSet ? t('adminOAuthClients.webhooks.form.bearerReplacePlaceholder') : t('adminOAuthClients.webhooks.form.bearerPlaceholder')"
              @update:model-value="emit('update:bearer', String($event ?? ''))"
            />
            <p class="text-xs text-muted-foreground">
              {{ t("adminOAuthClients.webhooks.form.bearerHelp") }}
            </p>
          </div>
          <SettingsRow
            :icon="LucidePower"
            :tone="props.enabled ? 'success' : 'default'"
            :label="t('adminOAuthClients.webhooks.form.enabled')"
            :help="t('adminOAuthClients.webhooks.form.enabledHelp')"
            label-for="oauth-webhook-enabled"
          >
            <Switch id="oauth-webhook-enabled" :model-value="props.enabled" @update:model-value="emit('update:enabled', Boolean($event))" />
          </SettingsRow>
          <SettingsRow
            v-if="props.editingWebhook?.bearerSet"
            :icon="LucideEraser"
            :tone="props.clearBearer ? 'danger' : 'default'"
            :label="t('adminOAuthClients.webhooks.form.clearBearer')"
            :help="t('adminOAuthClients.webhooks.form.clearBearerHelp')"
            label-for="oauth-webhook-clear-bearer"
          >
            <Switch id="oauth-webhook-clear-bearer" :model-value="props.clearBearer" @update:model-value="emit('update:clear-bearer', Boolean($event))" />
          </SettingsRow>
        </SettingsGroup>
      </DialogBody>
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
