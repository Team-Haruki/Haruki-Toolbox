<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input, InputWithToggle } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucideCopy,
  LucideExternalLink,
  LucideKeyRound,
  LucideLoader2,
  LucidePlus,
  LucideRefreshCw,
  LucideSave,
  LucideTrash2,
  LucideUsers,
} from "lucide-vue-next"
import { useAdminWebhookManagement } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"

const { t } = useI18n()

const {
  canMutate,
  settingsLoading,
  settingsSaving,
  settings,
  settingsEnabled,
  jwtSecretInput,
  endpointsLoading,
  endpoints,
  endpointsGeneratedAt,
  endpointsTotal,
  formOpen,
  formMode,
  formId,
  formCredential,
  formCallbackUrl,
  formBearer,
  formEnabled,
  formClearBearer,
  formSaving,
  deleteOpen,
  deleting,
  deleteTarget,
  tokenDialogOpen,
  latestToken,
  latestTokenHeaderName,
  latestTokenWebhook,
  subscribersOpen,
  subscribersLoading,
  subscribers,
  subscribersGeneratedAt,
  subscribersWebhook,
  refreshAll,
  openCreateDialog,
  openEditDialog,
  saveWebhook,
  confirmDelete,
  executeDelete,
  saveSettings,
  openSubscribers,
  copyLatestToken,
  formatDate,
  serverLabel,
  dataTypeLabel,
} = useAdminWebhookManagement()

const formTitle = computed(() =>
  formMode.value === "create"
    ? t("adminWebhooks.form.createTitle")
    : t("adminWebhooks.form.editTitle")
)

function endpointStatusClass(enabled: boolean) {
  return enabled
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div class="space-y-1">
          <CardTitle>{{ t("adminWebhooks.settings.title") }}</CardTitle>
          <CardDescription>{{ t("adminWebhooks.settings.description") }}</CardDescription>
        </div>
        <Button variant="outline" :disabled="settingsLoading || endpointsLoading" @click="refreshAll">
          <LucideRefreshCw class="w-4 h-4 mr-2" />
          {{ t("adminWebhooks.actions.refresh") }}
        </Button>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <template v-if="settingsLoading">
          <Skeleton class="h-28 w-full" />
        </template>
        <template v-else>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.globalStatus") }}</div>
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    endpointStatusClass(settings.enabled),
                  ]"
                >
                  {{ settings.enabled ? t("adminWebhooks.status.enabled") : t("adminWebhooks.status.disabled") }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ t("adminWebhooks.settings.globalStatusHint") }}
                </span>
              </div>
            </div>

            <div class="rounded-xl border bg-muted/20 p-4 space-y-2">
              <div class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretStatus") }}</div>
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                    settings.jwtSecretConfigured
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                  ]"
                >
                  {{ settings.jwtSecretConfigured ? t("adminWebhooks.status.configured") : t("adminWebhooks.status.notConfigured") }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ t("adminWebhooks.settings.jwtSecretStatusHint") }}
                </span>
              </div>
            </div>
          </div>

          <Alert v-if="!settings.jwtSecretConfigured" variant="default">
            <LucideKeyRound />
            <AlertTitle>{{ t("adminWebhooks.settings.secretAlertTitle") }}</AlertTitle>
            <AlertDescription>{{ t("adminWebhooks.settings.secretAlertDescription") }}</AlertDescription>
          </Alert>

          <div class="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
            <div class="flex items-center gap-3">
              <Switch
                id="admin-webhooks-enabled"
                :model-value="settingsEnabled"
                :disabled="!canMutate || settingsSaving"
                @update:model-value="settingsEnabled = !!$event"
              />
              <Label for="admin-webhooks-enabled">{{ t("adminWebhooks.settings.enableSwitchLabel") }}</Label>
            </div>

            <div class="space-y-3">
              <div class="space-y-2">
                <Label for="admin-webhooks-jwt-secret">{{ t("adminWebhooks.settings.jwtSecretLabel") }}</Label>
                <InputWithToggle
                  id="admin-webhooks-jwt-secret"
                  v-model="jwtSecretInput"
                  type="password"
                  :placeholder="t('adminWebhooks.settings.jwtSecretPlaceholder')"
                  :disabled="!canMutate || settingsSaving"
                />
                <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretHelp") }}</p>
              </div>
              <div v-if="canMutate" class="flex justify-end">
                <Button :disabled="settingsSaving" @click="saveSettings">
                  <LucideLoader2 v-if="settingsSaving" class="w-4 h-4 mr-2 animate-spin" />
                  <LucideSave v-else class="w-4 h-4 mr-2" />
                  {{ t("common.save") }}
                </Button>
              </div>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div class="space-y-1">
          <CardTitle>{{ t("adminWebhooks.list.title") }}</CardTitle>
          <CardDescription>
            {{ t("adminWebhooks.list.description") }}
            <span v-if="endpointsGeneratedAt" class="block mt-1">
              {{ t("adminWebhooks.list.generatedAt", { date: formatDate(endpointsGeneratedAt) }) }}
            </span>
          </CardDescription>
        </div>
        <Button v-if="canMutate" @click="openCreateDialog">
          <LucidePlus class="w-4 h-4 mr-2" />
          {{ t("adminWebhooks.actions.create") }}
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <div class="px-6 pb-4 text-sm text-muted-foreground">
          {{ t("adminWebhooks.list.total", { total: endpointsTotal }) }}
        </div>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("adminWebhooks.table.id") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.table.callbackUrl") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.table.credential") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.table.status") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.table.subscriptions") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.table.createdAt") }}</TableHead>
                <TableHead class="text-right">{{ t("adminWebhooks.table.actions") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="endpointsLoading">
                <TableRow v-for="row in 4" :key="row">
                  <TableCell colspan="7">
                    <Skeleton class="h-8 w-full" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else-if="endpoints.length > 0">
                <TableRow v-for="webhook in endpoints" :key="webhook.id">
                  <TableCell class="font-medium">{{ webhook.id }}</TableCell>
                  <TableCell class="min-w-[16rem]">
                    <a
                      :href="webhook.callbackUrl"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex items-center gap-1 break-all text-primary hover:underline"
                    >
                      {{ webhook.callbackUrl }}
                      <LucideExternalLink class="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell class="font-mono text-xs break-all">{{ webhook.credential }}</TableCell>
                  <TableCell>
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        endpointStatusClass(webhook.enabled),
                      ]"
                    >
                      {{ webhook.enabled ? t("adminWebhooks.status.enabled") : t("adminWebhooks.status.disabled") }}
                    </span>
                  </TableCell>
                  <TableCell>{{ webhook.subscriptionCount }}</TableCell>
                  <TableCell>{{ formatDate(webhook.createdAt) }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" @click="openSubscribers(webhook)">
                        <LucideUsers class="w-4 h-4 mr-1" />
                        {{ t("adminWebhooks.actions.subscribers") }}
                      </Button>
                      <Button v-if="canMutate" variant="outline" size="sm" @click="openEditDialog(webhook)">
                        {{ t("adminWebhooks.actions.edit") }}
                      </Button>
                      <Button v-if="canMutate" variant="destructive" size="sm" @click="confirmDelete(webhook)">
                        <LucideTrash2 class="w-4 h-4 mr-1" />
                        {{ t("adminWebhooks.actions.delete") }}
                      </Button>
                    </div>
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

    <Dialog :open="formOpen" @update:open="formOpen = $event">
      <DialogScrollContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ formTitle }}</DialogTitle>
          <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.form.description") }}</p>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="saveWebhook">
          <div v-if="formMode === 'create'" class="space-y-2">
            <Label for="webhook-id">{{ t("adminWebhooks.form.idLabel") }}</Label>
            <Input
              id="webhook-id"
              v-model="formId"
              :placeholder="t('adminWebhooks.form.idPlaceholder')"
              :disabled="formSaving"
            />
            <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.idHelp") }}</p>
          </div>

          <div v-else class="space-y-2">
            <Label>{{ t("adminWebhooks.form.idLabel") }}</Label>
            <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm font-medium">{{ formId }}</div>
          </div>

          <div class="space-y-2">
            <Label for="webhook-callback-url">{{ t("adminWebhooks.form.callbackUrlLabel") }}</Label>
            <Input
              id="webhook-callback-url"
              v-model="formCallbackUrl"
              type="url"
              :placeholder="t('adminWebhooks.form.callbackUrlPlaceholder')"
              :disabled="formSaving"
            />
          </div>

          <div class="space-y-2">
            <Label for="webhook-credential">{{ t("adminWebhooks.form.credentialLabel") }}</Label>
            <Input
              id="webhook-credential"
              v-model="formCredential"
              :placeholder="t('adminWebhooks.form.credentialPlaceholder')"
              :disabled="formSaving"
            />
            <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.credentialHelp") }}</p>
          </div>

          <div class="space-y-2">
            <Label for="webhook-bearer">{{ t("adminWebhooks.form.bearerLabel") }}</Label>
            <InputWithToggle
              id="webhook-bearer"
              v-model="formBearer"
              type="password"
              :placeholder="t('adminWebhooks.form.bearerPlaceholder')"
              :disabled="formSaving || formClearBearer"
            />
            <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.bearerHelp") }}</p>
          </div>

          <div v-if="formMode === 'edit'" class="flex items-center gap-3">
            <Checkbox
              id="webhook-clear-bearer"
              :model-value="formClearBearer"
              @update:model-value="formClearBearer = $event === true"
            />
            <Label for="webhook-clear-bearer">{{ t("adminWebhooks.form.clearBearerLabel") }}</Label>
          </div>

          <div class="flex items-center gap-3">
            <Switch
              id="webhook-enabled"
              :model-value="formEnabled"
              :disabled="formSaving"
              @update:model-value="formEnabled = !!$event"
            />
            <Label for="webhook-enabled">{{ t("adminWebhooks.form.enabledLabel") }}</Label>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">{{ t("adminWebhooks.actions.cancel") }}</Button>
            </DialogClose>
            <Button type="submit" :disabled="formSaving">
              <LucideLoader2 v-if="formSaving" class="w-4 h-4 mr-2 animate-spin" />
              <LucideSave v-else class="w-4 h-4 mr-2" />
              {{ formMode === "create" ? t("adminWebhooks.actions.create") : t("common.save") }}
            </Button>
          </DialogFooter>
        </form>
      </DialogScrollContent>
    </Dialog>

    <Dialog :open="deleteOpen" @update:open="deleteOpen = $event">
      <DialogScrollContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{{ t("adminWebhooks.deleteDialog.title") }}</DialogTitle>
          <p class="text-sm text-muted-foreground">
            {{ t("adminWebhooks.deleteDialog.description", { id: deleteTarget?.id ?? '' }) }}
          </p>
        </DialogHeader>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">{{ t("adminWebhooks.actions.cancel") }}</Button>
          </DialogClose>
          <Button variant="destructive" :disabled="deleting" @click="executeDelete">
            <LucideLoader2 v-if="deleting" class="w-4 h-4 mr-2 animate-spin" />
            <LucideTrash2 v-else class="w-4 h-4 mr-2" />
            {{ t("adminWebhooks.deleteDialog.confirm") }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <Dialog :open="tokenDialogOpen" @update:open="tokenDialogOpen = $event">
      <DialogScrollContent class="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{{ t("adminWebhooks.tokenDialog.title") }}</DialogTitle>
          <p class="text-sm text-muted-foreground">
            {{ t("adminWebhooks.tokenDialog.description", { id: latestTokenWebhook?.id ?? '' }) }}
          </p>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label>{{ t("adminWebhooks.tokenDialog.headerNameLabel") }}</Label>
            <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono">
              {{ latestTokenHeaderName }}
            </div>
          </div>

          <div class="space-y-2">
            <Label>{{ t("adminWebhooks.tokenDialog.tokenLabel") }}</Label>
            <div class="max-h-56 overflow-auto rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono break-all select-all">
              {{ latestToken }}
            </div>
            <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.tokenHelp") }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="copyLatestToken">
            <LucideCopy class="w-4 h-4 mr-2" />
            {{ t("adminWebhooks.actions.copyToken") }}
          </Button>
          <DialogClose as-child>
            <Button>{{ t("adminWebhooks.tokenDialog.close") }}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <Dialog :open="subscribersOpen" @update:open="subscribersOpen = $event">
      <DialogScrollContent class="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{{ t("adminWebhooks.subscribers.title", { id: subscribersWebhook?.id ?? '' }) }}</DialogTitle>
          <p class="text-sm text-muted-foreground">
            {{ t("adminWebhooks.subscribers.description") }}
            <span v-if="subscribersGeneratedAt" class="block mt-1">
              {{ t("adminWebhooks.subscribers.generatedAt", { date: formatDate(subscribersGeneratedAt) }) }}
            </span>
          </p>
        </DialogHeader>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("adminWebhooks.subscribers.userId") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.subscribers.server") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.subscribers.dataType") }}</TableHead>
                <TableHead>{{ t("adminWebhooks.subscribers.createdAt") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="subscribersLoading">
                <TableRow v-for="row in 3" :key="row">
                  <TableCell colspan="4">
                    <Skeleton class="h-8 w-full" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else-if="subscribers.length > 0">
                <TableRow v-for="subscriber in subscribers" :key="`${subscriber.userId}-${subscriber.server}-${subscriber.dataType}-${subscriber.createdAt}`">
                  <TableCell class="font-medium">{{ subscriber.userId }}</TableCell>
                  <TableCell>{{ serverLabel(subscriber.server) }}</TableCell>
                  <TableCell>{{ dataTypeLabel(subscriber.dataType) }}</TableCell>
                  <TableCell>{{ formatDate(subscriber.createdAt) }}</TableCell>
                </TableRow>
              </template>
              <TableRow v-else>
                <TableCell colspan="4" class="h-24 text-center text-muted-foreground">
                  {{ t("adminWebhooks.subscribers.empty") }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
