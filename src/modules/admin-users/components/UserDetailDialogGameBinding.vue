<script setup lang="ts">
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import type { MysekaiDataPrivacySettings, SekaiRegion, SuiteDataPrivacySettings } from "@/types/store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  MYSEKAI_PERMISSION_TITLE_KEYS,
  MYSEKAI_PERMISSION_OPTIONS,
  SUITE_PERMISSION_TITLE_KEYS,
  SUITE_PERMISSION_OPTIONS,
} from "@/lib/game-binding-permission-meta"
import { isSekaiRegion } from "@/lib/sekai-region"
import { resolveServerLabel } from "@/modules/admin-users/constants"

defineProps<{
  open: boolean
  isEditMode: boolean
  userName?: string
  actionLoading: boolean
  server: SekaiRegion
  gameUserId: string
  suite: SuiteDataPrivacySettings
  mysekai: MysekaiDataPrivacySettings
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:server", value: SekaiRegion): void
  (e: "update:game-user-id", value: string): void
  (e: "update:suite", value: SuiteDataPrivacySettings): void
  (e: "update:mysekai", value: MysekaiDataPrivacySettings): void
  (e: "save"): void
}>()

const { t, locale } = useI18n()
const permissionIdPrefix = useId()
const suitePermissionOptions = SUITE_PERMISSION_OPTIONS
const mysekaiPermissionOptions = MYSEKAI_PERMISSION_OPTIONS

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  emit("update:server", value)
}

function permissionId(group: "suite" | "mysekai", key: string): string {
  return `${permissionIdPrefix}-${group}-${key}`
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminUsers.detail.dialog.gameBinding.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminUsers.detail.dialog.gameBinding.description", { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label id="user-game-binding-server-label" for="user-game-binding-server">{{ t("adminUsers.detail.dialog.gameBinding.server") }}</Label>
          <Select id="user-game-binding-server" :key="locale" :model-value="server" @update:model-value="handleServerChange">
            <SelectTrigger aria-labelledby="user-game-binding-server-label" class="w-full" :disabled="isEditMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="region in ['jp', 'en', 'tw', 'kr', 'cn']"
                :key="region"
                :value="region"
              >
                {{ resolveServerLabel(region, t) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="user-game-binding-game-id">{{ t("adminUsers.detail.dialog.gameBinding.gameUserId") }}</Label>
          <Input
            id="user-game-binding-game-id"
            :model-value="gameUserId"
            :disabled="isEditMode"
            :placeholder="t('adminUsers.detail.dialog.gameBinding.gameUserIdPlaceholder')"
            @update:model-value="emit('update:game-user-id', String($event ?? ''))"
          />
        </div>
        <div class="border rounded-lg p-3">
          <h3 class="font-semibold text-sm">{{ t("adminUsers.detail.dialog.gameBinding.suiteSettings") }}</h3>
          <div class="grid gap-2 mt-2">
            <div
              v-for="option in suitePermissionOptions"
              :key="option.key"
              class="flex items-center justify-between"
            >
              <Label :for="permissionId('suite', option.key)" class="text-sm">
                {{ t(SUITE_PERMISSION_TITLE_KEYS[option.key]) }}
              </Label>
              <Switch
                :id="permissionId('suite', option.key)"
                :model-value="suite[option.key]"
                @update:model-value="emit('update:suite', { ...suite, [option.key]: !!$event })"
              />
            </div>
          </div>
        </div>
        <div class="border rounded-lg p-3">
          <h3 class="font-semibold text-sm">{{ t("adminUsers.detail.dialog.gameBinding.mysekaiSettings") }}</h3>
          <div class="grid gap-2 mt-2">
            <div
              v-for="option in mysekaiPermissionOptions"
              :key="option.key"
              class="flex items-center justify-between"
            >
              <Label :for="permissionId('mysekai', option.key)" class="text-sm">
                {{ t(MYSEKAI_PERMISSION_TITLE_KEYS[option.key]) }}
              </Label>
              <Switch
                :id="permissionId('mysekai', option.key)"
                :model-value="mysekai[option.key]"
                @update:model-value="emit('update:mysekai', { ...mysekai, [option.key]: !!$event })"
              />
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button @click="emit('save')" :disabled="!gameUserId.trim() || actionLoading">
          {{ t("adminUsers.common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
