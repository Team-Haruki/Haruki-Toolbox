<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
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
import { Switch } from "@/components/ui/switch"
import {
  Armchair,
  Bot,
  Globe,
  Save,
  ShieldAlert,
  ShieldCheck,
} from "lucide-vue-next"
import {
  MYSEKAI_PERMISSION_CARD_OPTIONS,
  PERMISSION_BOT_NAME_KEYS,
  SUITE_PERMISSION_CARD_OPTIONS,
  isMysekaiPermissionKey,
  isSuitePermissionKey,
  type MysekaiPermissionKey,
  type PermissionCardOption,
  type SuitePermissionKey,
} from "@/lib/game-binding-permission-meta"
import { isSekaiRegion } from "@/lib/sekai-region"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"

const props = defineProps<{
  open: boolean
  isCreating: boolean
  verificationTriggered: boolean
  /** The UID/server changed after verifying: Save is disabled until re-verified. */
  verificationInvalidated: boolean
  isSaving: boolean
  isVerifying: boolean
  allowCNMysekai: boolean
  userIdInput: string
  /** Inline error under the UID field; empty when valid. */
  userIdError: string
  editTarget: GameAccountBinding | null
  regionOptions: ReadonlyArray<{ value: SekaiRegion; label: string }>
}>()

const UID_INPUT_ID = "binding-user-id"
const UID_ERROR_ID = "binding-user-id-error"
const UID_HINT_ID = "binding-user-id-hint"

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:userIdInput", value: string): void
  (e: "update:editTarget", value: GameAccountBinding | null): void
  (e: "verify"): void
  (e: "save"): void
}>()

const { t, locale } = useI18n()

function cloneEditTarget(target: GameAccountBinding) {
  return {
    ...target,
    suite: target.suite ? { ...target.suite } : target.suite,
    mysekai: target.mysekai ? { ...target.mysekai } : target.mysekai,
  }
}

function updateEditTarget(mutator: (target: GameAccountBinding) => void) {
  if (!props.editTarget) return
  const next = cloneEditTarget(props.editTarget)
  mutator(next)
  emit("update:editTarget", next)
}

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  updateEditTarget((target) => {
    target.server = value
  })
}

function updateSuitePermission(key: SuitePermissionKey, value: boolean) {
  updateEditTarget((target) => {
    if (!target.suite) return
    target.suite[key] = value
  })
}

function updateMysekaiPermission(key: MysekaiPermissionKey, value: boolean) {
  updateEditTarget((target) => {
    if (!target.mysekai) return
    target.mysekai[key] = value
  })
}

const showMysekaiSettings = computed(() => {
  return props.allowCNMysekai || props.editTarget?.server !== "cn"
})

// --- Permission groups ---------------------------------------------------------
// Each upload gets a group: the switches that need explaining as a line each,
// the bot switches together on one line (same meaning, one shared hint).

type PermissionRowView = { key: string; icon: Component; title: string; description: string; value: boolean; unsafe: boolean }
type PermissionBotView = { key: string; name: string; title: string; value: boolean }
type PermissionGroupView = {
  key: "suite" | "mysekai"
  title: string
  rows: PermissionRowView[]
  bots: PermissionBotView[]
  update: (key: string, value: boolean) => void
}

const ROW_ICONS: Record<string, Component> = {
  allowPublicApi: Globe,
  allowFixtureApi: Armchair,
}

/**
 * Switches that expose the upload to anyone who knows the UID. They are
 * marked as unsafe (red icon well and a badge) so nobody turns one on
 * without noticing what it does.
 */
const UNSAFE_ROW_KEYS: ReadonlySet<string> = new Set(["allowPublicApi"])

function buildPermissionGroup<K extends string>(
  key: PermissionGroupView["key"],
  title: string,
  options: ReadonlyArray<PermissionCardOption<K>>,
  values: Partial<Record<K, boolean>> | null | undefined,
  update: PermissionGroupView["update"],
): PermissionGroupView {
  const rows: PermissionRowView[] = []
  const bots: PermissionBotView[] = []
  for (const option of options) {
    const value = values?.[option.key] === true
    const botNameKey = PERMISSION_BOT_NAME_KEYS[option.key]
    if (botNameKey) {
      bots.push({ key: option.key, name: t(botNameKey), title: t(option.titleKey), value })
    } else {
      rows.push({
        key: option.key,
        icon: ROW_ICONS[option.key] ?? Globe,
        title: t(option.titleKey),
        description: t(option.descriptionKey),
        value,
        unsafe: UNSAFE_ROW_KEYS.has(option.key),
      })
    }
  }
  return { key, title, rows, bots, update }
}

const permissionGroups = computed<PermissionGroupView[]>(() => {
  const groups = [
    buildPermissionGroup(
      "suite",
      t("userSettings.gameBinding.editDialog.suite.title"),
      SUITE_PERMISSION_CARD_OPTIONS,
      props.editTarget?.suite,
      (key, value) => {
        if (isSuitePermissionKey(key)) updateSuitePermission(key, value)
      },
    ),
  ]
  if (showMysekaiSettings.value) {
    groups.push(buildPermissionGroup(
      "mysekai",
      t("userSettings.gameBinding.editDialog.mysekai.title"),
      MYSEKAI_PERMISSION_CARD_OPTIONS,
      props.editTarget?.mysekai,
      (key, value) => {
        if (isMysekaiPermissionKey(key)) updateMysekaiPermission(key, value)
      },
    ))
  }
  return groups
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>
          {{ isCreating ? t("userSettings.gameBinding.editDialog.createTitle") : t("userSettings.gameBinding.editDialog.editTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ t("userSettings.gameBinding.editDialog.subtitle") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-5 py-1">
        <!-- Which account: fields while creating, a fixed summary afterwards. -->
        <SettingsGroup :title="t('userSettings.gameBinding.editDialog.basicInfoTitle')">
          <div v-if="isCreating" class="grid gap-3 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div class="grid content-start gap-1.5">
              <Label id="binding-server-label" for="binding-server">{{ t("userSettings.gameBinding.editDialog.fields.server") }}</Label>
              <Select id="binding-server" :key="locale" :model-value="editTarget?.server" @update:model-value="handleServerChange">
                <SelectTrigger class="w-full bg-background" :disabled="editTarget?.verified" aria-labelledby="binding-server-label">
                  <SelectValue :placeholder="t('userSettings.gameBinding.editDialog.serverPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid content-start gap-1.5">
              <Label :for="UID_INPUT_ID">{{ t("userSettings.gameBinding.editDialog.fields.userId") }}</Label>
              <Input
                :id="UID_INPUT_ID"
                :model-value="userIdInput"
                :disabled="editTarget?.verified"
                class="w-full bg-background"
                type="text"
                inputmode="numeric"
                pattern="\\d*"
                :aria-invalid="userIdError ? 'true' : undefined"
                :aria-describedby="userIdError ? UID_ERROR_ID : UID_HINT_ID"
                @update:model-value="emit('update:userIdInput', String($event ?? ''))"
              />
              <p v-if="userIdError" :id="UID_ERROR_ID" role="alert" class="text-xs text-destructive">{{ userIdError }}</p>
              <p v-else :id="UID_HINT_ID" class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.editDialog.uidHint") }}</p>
            </div>
          </div>

          <!-- An existing binding keeps its identity: show it as it is, and say
               why it cannot be edited, instead of two greyed-out fields. -->
          <div v-else-if="editTarget" class="px-4 py-3" data-testid="binding-identity">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <GameAccountOption :server="editTarget.server" :user-id="editTarget.userId" :is-default="editTarget.isDefault" inline-marks />
              <VerificationStatusBadge
                class="shrink-0"
                :verified="editTarget.verified === true"
                :verified-label="t('userSettings.gameBinding.status.verified')"
                :unverified-label="t('userSettings.gameBinding.status.unverified')"
              />
            </div>
            <p class="mt-1.5 text-xs text-muted-foreground">{{ t("userSettings.gameBinding.editDialog.identityLockedHint") }}</p>
          </div>

          <SettingsRow
            v-if="isCreating || !editTarget?.verified"
            :icon="ShieldCheck"
            :tone="editTarget?.verified ? 'success' : 'warning'"
            :label="t(editTarget?.verified ? 'userSettings.gameBinding.status.verified' : 'userSettings.gameBinding.status.unverified')"
          >
            <template #help>
              <span
                v-if="isCreating && verificationInvalidated && !verificationTriggered"
                role="status"
                class="font-medium text-amber-700 dark:text-amber-300"
              >
                {{ t("userSettings.gameBinding.validation.uidChangedReverify") }}
              </span>
              <span v-else-if="!editTarget?.verified && !verificationTriggered">
                {{ t("userSettings.gameBinding.editDialog.verifyHint") }}
              </span>
            </template>
            <Button
              v-if="!editTarget?.verified"
              variant="outline"
              size="sm"
              :disabled="isVerifying || isSaving"
              @click="emit('verify')"
            >
              {{ t("userSettings.gameBinding.editDialog.verifyButton") }}
            </Button>
          </SettingsRow>
        </SettingsGroup>

        <!-- One group per upload. Switches with something to explain get a
             line each; the bots share one line and one hint, with a compact
             switch per bot. -->
        <SettingsGroup
          v-for="group in permissionGroups"
          :key="group.key"
          :title="group.title"
          :data-testid="`binding-permissions-${group.key}`"
        >
          <SettingsRow
            v-for="row in group.rows"
            :key="row.key"
            :icon="row.icon"
            :tone="row.unsafe ? 'danger' : 'default'"
            :label="row.title"
            :help="row.description"
            :label-for="`binding-${group.key}-${row.key}`"
            :data-unsafe="row.unsafe || undefined"
          >
            <template v-if="row.unsafe" #label>
              <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive-tint-foreground">
                <ShieldAlert class="size-3" />
                {{ t("userSettings.gameBinding.permissions.unsafeBadge") }}
              </span>
            </template>
            <Switch
              :id="`binding-${group.key}-${row.key}`"
              :model-value="row.value"
              @update:model-value="group.update(row.key, $event)"
            />
          </SettingsRow>

          <SettingsRow
            v-if="group.bots.length > 0"
            :icon="Bot"
            :label="t('userSettings.gameBinding.permissions.botsTitle')"
            :help="t('userSettings.gameBinding.permissions.sharedHint')"
          >
            <template #below>
              <!-- On a phone the tiles take the row's full width (the slot is
                   indented under the label), or the bot names get cut off. -->
              <div class="-ml-11 grid grid-cols-2 gap-2 sm:ml-0">
                <label
                  v-for="bot in group.bots"
                  :key="bot.key"
                  :for="`binding-${group.key}-${bot.key}`"
                  class="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                  :title="bot.title"
                >
                  <span class="min-w-0 truncate">{{ bot.name }}</span>
                  <Switch
                    :id="`binding-${group.key}-${bot.key}`"
                    :model-value="bot.value"
                    :aria-label="bot.title"
                    @update:model-value="group.update(bot.key, $event)"
                  />
                </label>
              </div>
            </template>
          </SettingsRow>
        </SettingsGroup>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">
            {{ t("userSettings.common.cancel") }}
          </Button>
        </DialogClose>
        <Button
          :disabled="isSaving || (isCreating && !verificationTriggered)"
          @click="emit('save')"
        >
          <Save class="size-4" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
