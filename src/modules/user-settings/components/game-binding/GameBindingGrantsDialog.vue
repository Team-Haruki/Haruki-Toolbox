<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  LucideCopy,
  LucidePencil,
  LucideRefreshCw,
  LucideTrash2,
  LucideX,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { copyTextToClipboard } from "@/lib/clipboard"
import { formatLocalizedDate } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
import { cn } from "@/lib/utils"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import {
  canGrantWrite,
  isGrantDataType,
} from "@/modules/user-settings/lib/game-account-grants"
import { GRANT_FORM_FIELD_IDS, type GrantFormField } from "@/modules/user-settings/composables/useGameAccountDataGrants"
import type {
  GameAccountBinding,
  GameAccountDataGrant,
  GameAccountGrantDataType,
  GameAccountGrantPermission,
  SekaiRegion,
} from "@/types"

const props = defineProps<{
  open: boolean
  loading: boolean
  loadError: ErrorDescription | null
  saving: boolean
  deleting: boolean
  selectedAccount: GameAccountBinding | null
  selectedAccountGrants: GameAccountDataGrant[]
  receivedGrants: GameAccountDataGrant[]
  granteeUserId: string
  dataType: GameAccountGrantDataType
  canRead: boolean
  canWrite: boolean
  expiresAt: Date | undefined
  editingGrant: GameAccountDataGrant | null
  fieldErrors: Record<GrantFormField, string>
  revokeTarget: GameAccountDataGrant | null
  revokeDialogOpen: boolean
  regionLabels: Record<SekaiRegion, string>
  currentUserId: string | null
  /** Runs the revoke of `revokeTarget`; rejects on failure so the dialog stays open. */
  onRevoke: () => Promise<unknown>
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:grantee-user-id", value: string): void
  (event: "update:data-type", value: GameAccountGrantDataType): void
  (event: "update:can-read", value: boolean): void
  (event: "update:can-write", value: boolean): void
  (event: "update:expires-at", value: Date | undefined): void
  (event: "update:revoke-dialog-open", value: boolean): void
  (event: "clear-field-error", field: GrantFormField): void
  (event: "refresh"): void
  (event: "save"): void
  (event: "edit", grant: GameAccountDataGrant): void
  (event: "cancel-edit"): void
  (event: "request-revoke", grant: GameAccountDataGrant): void
}>()

const { t, locale } = useI18n()

const FIELD_IDS = GRANT_FORM_FIELD_IDS
const ERROR_IDS: Record<GrantFormField, string> = {
  granteeUserId: "grant-user-id-error",
  permissions: "grant-permissions-error",
  expiresAt: "grant-expires-at-error",
}

const selectedAccountLabel = computed(() => {
  const account = props.selectedAccount
  if (!account) return t("userSettings.gameBinding.grants.noSelectedAccount")
  return `${props.regionLabels[account.server] ?? account.server} / ${account.userId}`
})

const hasSelectedAccount = computed(() => props.selectedAccount !== null)
const isEditing = computed(() => props.editingGrant !== null)
const dialogDescription = computed(() =>
  hasSelectedAccount.value
    ? t("userSettings.gameBinding.grants.description")
    : t("userSettings.gameBinding.grants.receivedDescription")
)

const writeAllowedForDataType = computed(() => canGrantWrite(props.dataType))

const formTitle = computed(() => {
  const editing = props.editingGrant
  if (!editing) return t("userSettings.gameBinding.grants.form.title")
  return t("userSettings.gameBinding.grants.form.editTitle", {
    grantee: granteeDisplay(editing),
    dataType: dataTypeLabel(editing.dataType),
  })
})

function dataTypeLabel(value: GameAccountGrantDataType) {
  return t(`userSettings.gameBinding.grants.dataType.${value}`)
}

function permissionLabel(value: GameAccountGrantPermission) {
  return t(`userSettings.gameBinding.grants.permission.${value}`)
}

function permissionsLabel(permissions: readonly GameAccountGrantPermission[]) {
  const hasRead = permissions.includes("read")
  const hasWrite = permissions.includes("write")
  if (hasRead && hasWrite) return t("userSettings.gameBinding.grants.permission.readWrite")
  if (hasWrite) return t("userSettings.gameBinding.grants.permission.writeOnly")
  return t("userSettings.gameBinding.grants.permission.readOnly")
}

function granteeDisplay(grant: GameAccountDataGrant) {
  return grant.granteeUserName ? `${grant.granteeUserName} (${grant.granteeUserId})` : grant.granteeUserId
}

function ownerDisplay(grant: GameAccountDataGrant) {
  return grant.ownerUserName ?? t("userSettings.gameBinding.grants.ownerFallback", { id: grant.ownerUserId })
}

function accountDisplay(grant: GameAccountDataGrant) {
  return `${props.regionLabels[grant.server] ?? grant.server} / ${grant.gameUserId}`
}

function isEditingRow(grant: GameAccountDataGrant) {
  return props.editingGrant?.id === grant.id
}

function toChecked(value: unknown): boolean {
  return value === true
}

function formatDate(value: string) {
  return formatLocalizedDate(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    t("userSettings.gameBinding.grants.fallback")
  )
}

function handleDataTypeChange(value: unknown) {
  if (isGrantDataType(value)) {
    emit("update:data-type", value)
  }
}

function handleReadChange(value: unknown) {
  emit("update:can-read", toChecked(value))
  emit("clear-field-error", "permissions")
}

function handleWriteChange(value: unknown) {
  emit("update:can-write", toChecked(value))
  emit("clear-field-error", "permissions")
}

function handleExpiresAtChange(value: Date | undefined) {
  emit("update:expires-at", value)
  emit("clear-field-error", "expiresAt")
}

async function copyOwnUserId() {
  const id = props.currentUserId
  if (!id) return
  if (await copyTextToClipboard(id)) {
    toast.success(t("sidebarUser.toolboxIdCopied"))
  } else {
    toast.error(t("sidebarUser.copyFailed"))
  }
}

const revokeDescription = computed(() => {
  const grant = props.revokeTarget
  if (!grant) return ""
  return t("userSettings.gameBinding.grants.revokeDialog.description", {
    grantee: granteeDisplay(grant),
    account: accountDisplay(grant),
    dataType: dataTypeLabel(grant.dataType),
    permissions: permissionsLabel(grant.permissions),
  })
})
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <!-- Scrolls inside the viewport on every size: the two lists can be long. -->
    <DialogContent class="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto sm:max-w-[min(96vw,72rem)] sm:max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.grants.title") }}</DialogTitle>
        <DialogDescription class="space-y-1">
          <span class="block">{{ dialogDescription }}</span>
          <span class="block text-xs">{{ t("userSettings.gameBinding.grants.dataTypesExplainer") }}</span>
        </DialogDescription>
      </DialogHeader>

      <div v-if="props.currentUserId" class="flex flex-wrap items-center gap-1.5 text-sm">
        <span class="text-muted-foreground">{{ t("userSettings.gameBinding.grants.yourUserId") }}</span>
        <span class="font-mono text-xs">{{ props.currentUserId }}</span>
        <Button
          variant="ghost"
          size="icon"
          class="size-6"
          :title="t('sidebarUser.copyToolboxId')"
          :aria-label="t('sidebarUser.copyToolboxId')"
          @click="copyOwnUserId"
        >
          <LucideCopy class="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div v-if="hasSelectedAccount" class="text-sm text-muted-foreground">
          {{ t("userSettings.gameBinding.grants.selectedAccount", { account: selectedAccountLabel }) }}
        </div>
        <Button variant="outline" size="sm" class="ml-auto" :disabled="props.loading" @click="emit('refresh')">
          <LucideRefreshCw class="h-4 w-4" :class="props.loading ? 'animate-spin' : ''" aria-hidden="true" />
          {{ t("userSettings.gameBinding.grants.actions.refresh") }}
        </Button>
      </div>

      <LoadErrorState
        v-if="props.loadError && !props.loading"
        :title="t('userSettings.gameBinding.grants.toast.loadFailedTitle')"
        :description="props.loadError.message"
        :detail="props.loadError.detail"
        :retrying="props.loading"
        @retry="emit('refresh')"
      />

      <template v-else>
        <div v-if="hasSelectedAccount" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div
            :class="cn('rounded-md border p-4', isEditing && 'border-primary/50 bg-primary/5')"
            data-testid="grant-form"
            :data-mode="isEditing ? 'edit' : 'create'"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <h3 class="text-sm font-medium">{{ formTitle }}</h3>
              <Button v-if="isEditing" variant="ghost" size="sm" class="h-7" :disabled="props.saving" @click="emit('cancel-edit')">
                <LucideX class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t("userSettings.gameBinding.grants.actions.cancelEdit") }}
              </Button>
            </div>
            <!-- Always visible: who the uploads/reads land on. -->
            <p class="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {{ t("userSettings.gameBinding.grants.form.targetAccount", { account: selectedAccountLabel }) }}
            </p>
            <p v-if="isEditing" class="mt-2 text-xs text-muted-foreground">
              {{ t("userSettings.gameBinding.grants.form.lockedWhileEditing") }}
            </p>
            <div class="mt-4 space-y-3">
              <div class="space-y-1.5">
                <Label :for="FIELD_IDS.granteeUserId">{{ t("userSettings.gameBinding.grants.form.granteeUserId") }}</Label>
                <Input
                  :id="FIELD_IDS.granteeUserId"
                  :model-value="props.granteeUserId"
                  :placeholder="t('userSettings.gameBinding.grants.form.granteeUserIdPlaceholder')"
                  :disabled="isEditing"
                  :aria-invalid="props.fieldErrors.granteeUserId ? 'true' : undefined"
                  :aria-describedby="props.fieldErrors.granteeUserId ? ERROR_IDS.granteeUserId : undefined"
                  @update:model-value="emit('update:grantee-user-id', String($event ?? '')); emit('clear-field-error', 'granteeUserId')"
                />
                <p v-if="props.fieldErrors.granteeUserId" :id="ERROR_IDS.granteeUserId" role="alert" class="text-xs text-destructive">
                  {{ props.fieldErrors.granteeUserId }}
                </p>
              </div>
              <div class="space-y-1.5">
                <Label id="grant-data-type-label" for="grant-data-type">{{ t("userSettings.gameBinding.grants.form.dataType") }}</Label>
                <Select id="grant-data-type" :key="locale" :model-value="props.dataType" :disabled="isEditing" @update:model-value="handleDataTypeChange">
                  <SelectTrigger class="w-full" aria-labelledby="grant-data-type-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suite">{{ dataTypeLabel("suite") }}</SelectItem>
                    <SelectItem value="mysekai">{{ dataTypeLabel("mysekai") }}</SelectItem>
                    <SelectItem value="profile">{{ dataTypeLabel("profile") }}</SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="props.dataType === 'profile'" class="text-xs text-muted-foreground">
                  {{ t("userSettings.gameBinding.grants.form.profileHint") }}
                </p>
              </div>
              <fieldset class="space-y-1.5" :aria-describedby="props.fieldErrors.permissions ? ERROR_IDS.permissions : undefined">
                <legend class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.form.permissions") }}</legend>
                <div class="flex flex-wrap gap-4">
                  <label class="flex min-h-9 items-center gap-2 text-sm">
                    <Checkbox
                      :id="FIELD_IDS.permissions"
                      :model-value="props.canRead"
                      :aria-invalid="props.fieldErrors.permissions ? 'true' : undefined"
                      @update:model-value="handleReadChange"
                    />
                    <span>{{ permissionLabel("read") }}</span>
                  </label>
                  <label class="flex min-h-9 items-center gap-2 text-sm" :class="{ 'text-muted-foreground': !writeAllowedForDataType }">
                    <Checkbox
                      id="grant-permission-write"
                      :model-value="props.canWrite"
                      :disabled="!writeAllowedForDataType"
                      :aria-invalid="props.fieldErrors.permissions ? 'true' : undefined"
                      @update:model-value="handleWriteChange"
                    />
                    <span>{{ permissionLabel("write") }}</span>
                  </label>
                </div>
                <p v-if="props.fieldErrors.permissions" :id="ERROR_IDS.permissions" role="alert" class="text-xs text-destructive">
                  {{ props.fieldErrors.permissions }}
                </p>
                <p v-else class="text-xs text-muted-foreground">
                  {{ writeAllowedForDataType
                    ? t("userSettings.gameBinding.grants.form.writeHint")
                    : t("userSettings.gameBinding.grants.form.profileReadOnlyHint") }}
                </p>
                <div
                  v-if="props.canWrite"
                  class="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                >
                  <p class="font-medium">
                    {{ t("userSettings.gameBinding.grants.form.writeTargetNotice", { account: selectedAccountLabel, dataType: dataTypeLabel(props.dataType) }) }}
                  </p>
                  <p v-if="!props.canRead" class="mt-1">
                    {{ t("userSettings.gameBinding.grants.form.writeOnlyNotice") }}
                  </p>
                </div>
              </fieldset>
              <div class="space-y-1.5">
                <Label :for="FIELD_IDS.expiresAt">{{ t("userSettings.gameBinding.grants.form.expiresAt") }}</Label>
                <DateTimePicker24h
                  :id="FIELD_IDS.expiresAt"
                  :model-value="props.expiresAt"
                  :invalid="!!props.fieldErrors.expiresAt"
                  :described-by="props.fieldErrors.expiresAt ? ERROR_IDS.expiresAt : undefined"
                  @update:model-value="handleExpiresAtChange"
                />
                <p v-if="props.fieldErrors.expiresAt" :id="ERROR_IDS.expiresAt" role="alert" class="text-xs text-destructive">
                  {{ props.fieldErrors.expiresAt }}
                </p>
                <p v-else class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.grants.form.expiresAtHelp") }}</p>
              </div>
              <Button class="w-full" :disabled="props.saving || !props.selectedAccount?.verified" @click="emit('save')">
                {{ isEditing ? t("userSettings.gameBinding.grants.actions.saveChanges") : t("userSettings.gameBinding.grants.actions.save") }}
              </Button>
            </div>
          </div>

          <div class="rounded-md border">
            <div class="border-b px-4 py-3">
              <h3 class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.ownedTitle") }}</h3>
            </div>
            <div v-if="props.loading" class="space-y-2 p-4">
              <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
            </div>
            <template v-else>
              <!-- Phones: one card per grant. -->
              <ul class="divide-y sm:hidden" data-testid="owned-grants-cards">
                <li
                  v-for="grant in props.selectedAccountGrants"
                  :key="grant.id"
                  :class="cn('space-y-2 px-4 py-3', isEditingRow(grant) && 'bg-primary/5')"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="break-all font-mono text-xs">{{ granteeDisplay(grant) }}</p>
                      <p class="mt-0.5 text-sm">{{ dataTypeLabel(grant.dataType) }} · {{ permissionsLabel(grant.permissions) }}</p>
                      <p class="text-xs text-muted-foreground">
                        {{ t("userSettings.gameBinding.grants.table.expiresAt") }}: {{ formatDate(grant.expiresAt) }}
                      </p>
                    </div>
                    <Badge v-if="isEditingRow(grant)" size="sm">{{ t("userSettings.gameBinding.grants.editingBadge") }}</Badge>
                  </div>
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" class="flex-1" :disabled="props.saving" @click="emit('edit', grant)">
                      <LucidePencil class="h-4 w-4" aria-hidden="true" />
                      {{ t("userSettings.gameBinding.grants.actions.edit") }}
                    </Button>
                    <Button variant="outline" size="sm" class="flex-1 text-destructive" :disabled="props.deleting" @click="emit('request-revoke', grant)">
                      <LucideTrash2 class="h-4 w-4" aria-hidden="true" />
                      {{ t("userSettings.gameBinding.grants.actions.revoke") }}
                    </Button>
                  </div>
                </li>
                <li v-if="props.selectedAccountGrants.length === 0" class="px-4 py-6 text-center text-sm text-muted-foreground">
                  {{ t("userSettings.gameBinding.grants.emptyOwned") }}
                </li>
              </ul>
              <!-- Wider screens: the table, with the shared edge-fade affordance. -->
              <div class="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{{ t("userSettings.gameBinding.grants.table.grantee") }}</TableHead>
                      <TableHead>{{ t("userSettings.gameBinding.grants.table.dataType") }}</TableHead>
                      <TableHead>{{ t("userSettings.gameBinding.grants.table.permissions") }}</TableHead>
                      <TableHead>{{ t("userSettings.gameBinding.grants.table.expiresAt") }}</TableHead>
                      <TableHead>{{ t("userSettings.gameBinding.grants.table.actions") }}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="grant in props.selectedAccountGrants"
                      :key="grant.id"
                      :class="isEditingRow(grant) ? 'bg-primary/5' : undefined"
                      :data-editing="isEditingRow(grant) ? 'true' : undefined"
                    >
                      <TableCell class="font-mono text-xs">
                        {{ granteeDisplay(grant) }}
                        <Badge v-if="isEditingRow(grant)" size="sm" class="ml-1 font-sans">{{ t("userSettings.gameBinding.grants.editingBadge") }}</Badge>
                      </TableCell>
                      <TableCell>{{ dataTypeLabel(grant.dataType) }}</TableCell>
                      <TableCell>{{ permissionsLabel(grant.permissions) }}</TableCell>
                      <TableCell>{{ formatDate(grant.expiresAt) }}</TableCell>
                      <TableCell>
                        <div class="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            :disabled="props.saving"
                            :title="t('userSettings.gameBinding.grants.actions.edit')"
                            :aria-label="t('userSettings.gameBinding.grants.actions.edit')"
                            @click="emit('edit', grant)"
                          >
                            <LucidePencil class="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            class="text-destructive"
                            :disabled="props.deleting"
                            :title="t('userSettings.gameBinding.grants.actions.revoke')"
                            :aria-label="t('userSettings.gameBinding.grants.actions.revoke')"
                            @click="emit('request-revoke', grant)"
                          >
                            <LucideTrash2 class="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow v-if="props.selectedAccountGrants.length === 0">
                      <TableCell :colspan="5" class="py-6 text-center text-muted-foreground">
                        {{ t("userSettings.gameBinding.grants.emptyOwned") }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </template>
          </div>
        </div>

        <div class="rounded-md border">
          <div class="border-b px-4 py-3">
            <h3 class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.receivedTitle") }}</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ t("userSettings.gameBinding.grants.receivedHint") }}</p>
            <p class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.grants.receivedUseHint") }}</p>
          </div>
          <div v-if="props.loading" class="space-y-2 p-4">
            <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
          </div>
          <template v-else>
            <ul class="divide-y sm:hidden" data-testid="received-grants-cards">
              <li v-for="grant in props.receivedGrants" :key="grant.id" class="space-y-1 px-4 py-3">
                <p class="text-sm font-medium break-words">{{ ownerDisplay(grant) }}</p>
                <p class="text-xs text-muted-foreground">{{ accountDisplay(grant) }}</p>
                <p class="text-sm">{{ dataTypeLabel(grant.dataType) }} · {{ permissionsLabel(grant.permissions) }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ t("userSettings.gameBinding.grants.table.expiresAt") }}: {{ formatDate(grant.expiresAt) }}
                </p>
              </li>
              <li v-if="props.receivedGrants.length === 0" class="px-4 py-6 text-center text-sm text-muted-foreground">
                {{ t("userSettings.gameBinding.grants.emptyReceived") }}
              </li>
            </ul>
            <div class="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ t("userSettings.gameBinding.grants.table.owner") }}</TableHead>
                    <TableHead>{{ t("userSettings.gameBinding.table.server") }}</TableHead>
                    <TableHead>{{ t("userSettings.gameBinding.table.userId") }}</TableHead>
                    <TableHead>{{ t("userSettings.gameBinding.grants.table.dataType") }}</TableHead>
                    <TableHead>{{ t("userSettings.gameBinding.grants.table.permissions") }}</TableHead>
                    <TableHead>{{ t("userSettings.gameBinding.grants.table.expiresAt") }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="grant in props.receivedGrants" :key="grant.id">
                    <TableCell>
                      <span class="block text-sm">{{ ownerDisplay(grant) }}</span>
                      <span v-if="grant.ownerUserName" class="block font-mono text-xs text-muted-foreground">{{ grant.ownerUserId }}</span>
                    </TableCell>
                    <TableCell>{{ props.regionLabels[grant.server] ?? grant.server }}</TableCell>
                    <TableCell class="font-mono text-xs">{{ grant.gameUserId }}</TableCell>
                    <TableCell>{{ dataTypeLabel(grant.dataType) }}</TableCell>
                    <TableCell>{{ permissionsLabel(grant.permissions) }}</TableCell>
                    <TableCell>{{ formatDate(grant.expiresAt) }}</TableCell>
                  </TableRow>
                  <TableRow v-if="props.receivedGrants.length === 0">
                    <TableCell :colspan="6" class="py-6 text-center text-muted-foreground">
                      {{ t("userSettings.gameBinding.grants.emptyReceived") }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </template>
        </div>
      </template>
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    :open="props.revokeDialogOpen"
    :title="t('userSettings.gameBinding.grants.revokeDialog.title')"
    :description="revokeDescription"
    :confirm-label="t('userSettings.gameBinding.grants.revokeDialog.confirm')"
    destructive
    :on-confirm="props.onRevoke"
    @update:open="emit('update:revoke-dialog-open', $event)"
  />
</template>
