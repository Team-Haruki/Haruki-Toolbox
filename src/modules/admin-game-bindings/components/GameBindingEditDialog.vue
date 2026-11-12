<script setup lang="ts">
import { computed, type Component } from "vue"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LucideArmchair, LucideBot, LucideGlobe, LucideShieldAlert } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import {
  isMysekaiPermissionKey,
  isSuitePermissionKey,
  MYSEKAI_PERMISSION_OPTIONS,
  MYSEKAI_PERMISSION_TITLE_KEYS,
  PERMISSION_BOT_NAME_KEYS,
  SUITE_PERMISSION_OPTIONS,
  SUITE_PERMISSION_TITLE_KEYS,
  type MysekaiPermissionKey,
  type SuitePermissionKey,
} from "@/lib/game-binding-permission-meta"
import { isSekaiRegion, resolveSekaiRegionLabel } from "@/lib/sekai-region"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import GameBindingServerBadge from "@/modules/admin-game-bindings/components/GameBindingServerBadge.vue"
import type { SekaiRegion } from "@/types/store"

type ServerOption = {
  value: SekaiRegion
  label: string
}

/**
 * Create or edit a binding, laid out like the user-facing dialog: the account
 * first (fields while creating, a fixed summary afterwards), then one group
 * per upload with a line for each switch that needs explaining and the bot
 * switches together on one line.
 */
const props = defineProps<{
  open: boolean
  isEditMode: boolean
  actionLoading: boolean
  editTargetUserId: string
  editServer: SekaiRegion
  editGameUserId: string
  editSuite: Record<string, boolean>
  editMysekai: Record<string, boolean>
  editServers: ReadonlyArray<ServerOption>
}>()
const { t, locale } = useI18n()
const FIELD_IDS = {
  toolboxUser: "game-binding-edit-toolbox-user",
  gameUser: "game-binding-edit-game-user",
} as const

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:editTargetUserId", value: string): void
  (e: "update:editServer", value: SekaiRegion): void
  (e: "update:editGameUserId", value: string): void
  (e: "update:suite", payload: { key: SuitePermissionKey; value: boolean }): void
  (e: "update:mysekai", payload: { key: MysekaiPermissionKey; value: boolean }): void
  (e: "save"): void
}>()

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  emit("update:editServer", value)
}

type PermissionRowView = { key: string; icon: Component; title: string; help: string; value: boolean; unsafe: boolean }
type PermissionBotView = { key: string; name: string; title: string; value: boolean }
type PermissionGroupView = {
  key: "suite" | "mysekai"
  title: string
  rows: PermissionRowView[]
  bots: PermissionBotView[]
  update: (key: string, value: boolean) => void
}

const ROW_ICONS: Record<string, Component> = {
  allowPublicApi: LucideGlobe,
  allowFixtureApi: LucideArmchair,
}

/** Switches that expose the upload to anyone who knows the UID. */
const UNSAFE_ROW_KEYS: ReadonlySet<string> = new Set(["allowPublicApi"])

function buildGroup(
  key: PermissionGroupView["key"],
  title: string,
  options: ReadonlyArray<{ key: string }>,
  titleKeys: Readonly<Record<string, string>>,
  values: Record<string, boolean>,
  update: PermissionGroupView["update"],
): PermissionGroupView {
  const rows: PermissionRowView[] = []
  const bots: PermissionBotView[] = []
  for (const option of options) {
    const value = values[option.key] === true
    const title = t(titleKeys[option.key] ?? option.key)
    const botNameKey = PERMISSION_BOT_NAME_KEYS[option.key]
    if (botNameKey) {
      bots.push({ key: option.key, name: t(botNameKey), title, value })
    } else {
      rows.push({
        key: option.key,
        icon: ROW_ICONS[option.key] ?? LucideGlobe,
        title,
        help: t(`adminGameBindings.editDialog.permissionHelp.${key}.${option.key}`),
        value,
        unsafe: UNSAFE_ROW_KEYS.has(option.key),
      })
    }
  }
  return { key, title, rows, bots, update }
}

const permissionGroups = computed<PermissionGroupView[]>(() => [
  buildGroup(
    "suite",
    t("adminGameBindings.editDialog.suiteSettingsTitle"),
    SUITE_PERMISSION_OPTIONS,
    SUITE_PERMISSION_TITLE_KEYS,
    props.editSuite,
    (key, value) => {
      if (isSuitePermissionKey(key)) emit("update:suite", { key, value })
    },
  ),
  buildGroup(
    "mysekai",
    t("adminGameBindings.editDialog.mysekaiSettingsTitle"),
    MYSEKAI_PERMISSION_OPTIONS,
    MYSEKAI_PERMISSION_TITLE_KEYS,
    props.editMysekai,
    (key, value) => {
      if (isMysekaiPermissionKey(key)) emit("update:mysekai", { key, value })
    },
  ),
])
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ props.isEditMode ? t("adminGameBindings.editDialog.editTitle") : t("adminGameBindings.editDialog.createTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ props.isEditMode ? t("adminGameBindings.editDialog.editDescription") : t("adminGameBindings.editDialog.createDescription") }}
        </DialogDescription>
      </DialogHeader>

      <DialogBody class="gap-5">
        <SettingsGroup :title="t('adminGameBindings.editDialog.accountTitle')">
          <!-- An existing binding keeps its identity: shown as it is, with
               where to change it, instead of three greyed-out fields. -->
          <div v-if="props.isEditMode" class="px-4 py-3" data-testid="admin-binding-identity">
            <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <GameBindingServerBadge :server="props.editServer" :label="resolveSekaiRegionLabel(props.editServer, t)" />
              <span class="min-w-0 font-mono text-sm font-medium tabular-nums [overflow-wrap:anywhere]">{{ props.editGameUserId }}</span>
            </div>
            <p class="mt-1.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminGameBindings.editDialog.owner", { userId: props.editTargetUserId }) }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">{{ t("adminGameBindings.editDialog.identityLockedHint") }}</p>
          </div>
          <div v-else class="grid gap-3 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label :for="FIELD_IDS.toolboxUser">{{ t("adminGameBindings.editDialog.toolboxUserId") }}</Label>
              <Input
                :id="FIELD_IDS.toolboxUser"
                class="bg-background"
                :model-value="props.editTargetUserId"
                :placeholder="t('adminGameBindings.editDialog.toolboxUserIdPlaceholder')"
                @update:model-value="emit('update:editTargetUserId', String($event ?? ''))"
              />
            </div>
            <div class="grid content-start gap-1.5">
              <Label id="game-binding-edit-server-label" for="game-binding-edit-server">{{ t("adminGameBindings.editDialog.server") }}</Label>
              <Select id="game-binding-edit-server" :key="locale" :model-value="props.editServer" @update:model-value="handleServerChange">
                <SelectTrigger aria-labelledby="game-binding-edit-server-label" class="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in props.editServers" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid content-start gap-1.5">
              <Label :for="FIELD_IDS.gameUser">{{ t("adminGameBindings.editDialog.gameUserId") }}</Label>
              <Input
                :id="FIELD_IDS.gameUser"
                class="bg-background"
                inputmode="numeric"
                :model-value="props.editGameUserId"
                :placeholder="t('adminGameBindings.editDialog.gameUserIdPlaceholder')"
                @update:model-value="emit('update:editGameUserId', String($event ?? ''))"
              />
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup
          v-for="group in permissionGroups"
          :key="group.key"
          :title="group.title"
          :data-testid="`admin-binding-permissions-${group.key}`"
        >
          <SettingsRow
            v-for="row in group.rows"
            :key="row.key"
            :icon="row.icon"
            :tone="row.unsafe ? 'danger' : 'default'"
            :label="row.title"
            :help="row.help"
            :label-for="`admin-binding-${group.key}-${row.key}`"
            :data-unsafe="row.unsafe || undefined"
          >
            <template v-if="row.unsafe" #label>
              <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive-tint-foreground">
                <LucideShieldAlert class="size-3" aria-hidden="true" />
                {{ t("userSettings.gameBinding.permissions.unsafeBadge") }}
              </span>
            </template>
            <Switch
              :id="`admin-binding-${group.key}-${row.key}`"
              :model-value="row.value"
              @update:model-value="group.update(row.key, $event)"
            />
          </SettingsRow>

          <SettingsRow
            v-if="group.bots.length > 0"
            :icon="LucideBot"
            :label="t('userSettings.gameBinding.permissions.botsTitle')"
            :help="t('adminGameBindings.editDialog.botsHint')"
          >
            <template #below>
              <!-- On a phone the tiles take the row's full width (the slot is
                   indented under the label), or the bot names get cut off. -->
              <div class="-ml-11 grid grid-cols-2 gap-x-6 gap-y-0.5 sm:ml-0">
                <label
                  v-for="bot in group.bots"
                  :key="bot.key"
                  :for="`admin-binding-${group.key}-${bot.key}`"
                  class="flex min-h-9 min-w-0 cursor-pointer items-center justify-between gap-2 text-sm pointer-coarse:min-h-10"
                  :title="bot.title"
                >
                  <span class="min-w-0 truncate">{{ bot.name }}</span>
                  <Switch
                    :id="`admin-binding-${group.key}-${bot.key}`"
                    :model-value="bot.value"
                    :aria-label="bot.title"
                    @update:model-value="group.update(bot.key, $event)"
                  />
                </label>
              </div>
            </template>
          </SettingsRow>
        </SettingsGroup>
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminGameBindings.common.cancel") }}</Button>
        <Button
          :disabled="!props.editTargetUserId.trim() || !props.editGameUserId.trim() || props.actionLoading"
          @click="emit('save')"
        >
          {{ props.isEditMode ? t("common.save") : t("adminGameBindings.common.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
