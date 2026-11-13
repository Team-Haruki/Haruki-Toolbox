<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import {
  Dialog,
  DialogBody,
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
  LucideCopy,
  LucidePencil,
  LucideRefreshCw,
  LucideTrash2,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { copyTextToClipboard } from "@/lib/clipboard"
import { formatLocalizedDate } from "@/lib/date-time"
import type { ErrorDescription } from "@/lib/error-utils"
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
/** Marks the form and the row it is editing as the same grant. */
const EDITING_TAG = "rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
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
  return formatLocalizedDate(value, "date", t("userSettings.gameBinding.grants.fallback"))
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
    <DialogContent size="xl">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.grants.title") }}</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <DialogBody class="@container gap-5">
        <!-- Who is granting, and for which account -->
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div class="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <p v-if="props.currentUserId" class="flex min-w-0 flex-wrap items-center gap-1.5">
              <span class="text-muted-foreground">{{ t("userSettings.gameBinding.grants.yourUserId") }}</span>
              <span class="font-mono text-xs [overflow-wrap:anywhere]">{{ props.currentUserId }}</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-6"
                :title="t('sidebarUser.copyToolboxId')"
                :aria-label="t('sidebarUser.copyToolboxId')"
                @click="copyOwnUserId"
              >
                <LucideCopy class="size-3.5" aria-hidden="true" />
              </Button>
            </p>
            <p v-if="hasSelectedAccount" class="text-muted-foreground">
              {{ t("userSettings.gameBinding.grants.selectedAccount", { account: selectedAccountLabel }) }}
            </p>
          </div>
          <Button variant="outline" size="sm" class="ml-auto" :disabled="props.loading" @click="emit('refresh')">
            <LucideRefreshCw class="size-4" :class="props.loading ? 'animate-spin' : ''" aria-hidden="true" />
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
          <div
            v-if="hasSelectedAccount"
            class="grid gap-x-8 gap-y-5 border-t border-border/60 pt-4 @min-[48rem]:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
          >
            <!-- The form: a new grant, or the one being edited -->
            <section data-testid="grant-form" :data-mode="isEditing ? 'edit' : 'create'" class="min-w-0">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  {{ formTitle }}
                  <span v-if="isEditing" :class="EDITING_TAG">{{ t("userSettings.gameBinding.grants.editingBadge") }}</span>
                </h3>
                <Button v-if="isEditing" variant="ghost" size="sm" class="h-7" :disabled="props.saving" @click="emit('cancel-edit')">
                  {{ t("userSettings.gameBinding.grants.actions.cancelEdit") }}
                </Button>
              </div>
              <p v-if="isEditing" class="mt-1 text-xs text-muted-foreground">
                {{ t("userSettings.gameBinding.grants.form.lockedWhileEditing") }}
              </p>
              <div class="mt-4 grid gap-4">
                <div class="grid gap-1.5">
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
                <div class="grid gap-1.5">
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
                <fieldset class="grid gap-1.5" :aria-describedby="props.fieldErrors.permissions ? ERROR_IDS.permissions : undefined">
                  <legend class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.form.permissions") }}</legend>
                  <div class="flex flex-wrap gap-4">
                    <label class="flex min-h-9 items-center gap-2 text-sm pointer-coarse:min-h-10">
                      <Checkbox
                        :id="FIELD_IDS.permissions"
                        class="pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']"
                        :model-value="props.canRead"
                        :aria-invalid="props.fieldErrors.permissions ? 'true' : undefined"
                        @update:model-value="handleReadChange"
                      />
                      <span>{{ permissionLabel("read") }}</span>
                    </label>
                    <label class="flex min-h-9 items-center gap-2 text-sm pointer-coarse:min-h-10" :class="{ 'text-muted-foreground': !writeAllowedForDataType }">
                      <Checkbox
                        id="grant-permission-write"
                        class="pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']"
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
                  <!-- Write access is the one thing here that needs a second look. -->
                  <div
                    v-if="props.canWrite"
                    class="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <p class="font-medium">
                      {{ t("userSettings.gameBinding.grants.form.writeTargetNotice", { account: selectedAccountLabel, dataType: dataTypeLabel(props.dataType) }) }}
                    </p>
                    <p v-if="!props.canRead" class="mt-1">
                      {{ t("userSettings.gameBinding.grants.form.writeOnlyNotice") }}
                    </p>
                  </div>
                </fieldset>
                <div class="grid gap-1.5">
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
            </section>

            <!-- What this account already shares -->
            <section class="min-w-0">
              <h3 class="flex items-baseline gap-2 text-sm font-semibold">
                {{ t("userSettings.gameBinding.grants.ownedTitle") }}
                <span v-if="!props.loading" class="text-xs font-normal tabular-nums text-muted-foreground">
                  {{ props.selectedAccountGrants.length }}
                </span>
              </h3>
              <div v-if="props.loading" class="mt-3 grid gap-2">
                <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
              </div>
              <p v-else-if="props.selectedAccountGrants.length === 0" class="mt-3 text-sm text-muted-foreground">
                {{ t("userSettings.gameBinding.grants.emptyOwned") }}
              </p>
              <ul v-else class="mt-1 divide-y divide-border/60" data-testid="owned-grants">
                <li
                  v-for="grant in props.selectedAccountGrants"
                  :key="grant.id"
                  class="flex items-start gap-3 py-2.5"
                  :data-editing="isEditingRow(grant) ? 'true' : undefined"
                >
                  <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs [overflow-wrap:anywhere]">
                      {{ granteeDisplay(grant) }}
                      <span v-if="isEditingRow(grant)" :class="[EDITING_TAG, 'font-sans']">{{ t("userSettings.gameBinding.grants.editingBadge") }}</span>
                    </p>
                    <p class="text-sm">{{ dataTypeLabel(grant.dataType) }} · {{ permissionsLabel(grant.permissions) }}</p>
                    <p class="text-xs tabular-nums text-muted-foreground">
                      {{ t("userSettings.gameBinding.grants.table.expiresAt") }}: {{ formatDate(grant.expiresAt) }}
                    </p>
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      :disabled="props.saving"
                      :title="t('userSettings.gameBinding.grants.actions.edit')"
                      :aria-label="t('userSettings.gameBinding.grants.actions.edit')"
                      @click="emit('edit', grant)"
                    >
                      <LucidePencil class="size-4" aria-hidden="true" />
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
                      <LucideTrash2 class="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          <!-- What other people share with you -->
          <section class="min-w-0 border-t border-border/60 pt-4">
            <h3 class="flex items-baseline gap-2 text-sm font-semibold">
              {{ t("userSettings.gameBinding.grants.receivedTitle") }}
              <span v-if="!props.loading" class="text-xs font-normal tabular-nums text-muted-foreground">
                {{ props.receivedGrants.length }}
              </span>
            </h3>
            <p class="mt-1 text-xs text-muted-foreground">{{ t("userSettings.gameBinding.grants.receivedUseHint") }}</p>
            <div v-if="props.loading" class="mt-3 grid gap-2">
              <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
            </div>
            <p v-else-if="props.receivedGrants.length === 0" class="mt-3 text-sm text-muted-foreground">
              {{ t("userSettings.gameBinding.grants.emptyReceived") }}
            </p>
            <ul v-else class="mt-1 divide-y divide-border/60" data-testid="received-grants">
              <li
                v-for="grant in props.receivedGrants"
                :key="grant.id"
                class="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-2.5"
              >
                <div class="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                  <p class="text-sm font-medium [overflow-wrap:anywhere]">{{ ownerDisplay(grant) }}</p>
                  <p v-if="grant.ownerUserName" class="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ grant.ownerUserId }}</p>
                  <p class="text-xs tabular-nums text-muted-foreground">{{ accountDisplay(grant) }}</p>
                </div>
                <div class="flex flex-col gap-0.5 @min-[32rem]:items-end">
                  <p class="text-sm">{{ dataTypeLabel(grant.dataType) }} · {{ permissionsLabel(grant.permissions) }}</p>
                  <p class="text-xs tabular-nums text-muted-foreground">
                    {{ t("userSettings.gameBinding.grants.table.expiresAt") }}: {{ formatDate(grant.expiresAt) }}
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </DialogBody>
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
