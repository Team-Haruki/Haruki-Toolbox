<script setup lang="ts">
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

const { t } = useI18n()
const suitePermissionOptions = SUITE_PERMISSION_OPTIONS
const mysekaiPermissionOptions = MYSEKAI_PERMISSION_OPTIONS

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  emit("update:server", value)
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
          <Label>{{ t("adminUsers.detail.dialog.gameBinding.server") }}</Label>
          <Select :model-value="server" @update:model-value="handleServerChange">
            <SelectTrigger class="w-full">
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
          <Label>{{ t("adminUsers.detail.dialog.gameBinding.gameUserId") }}</Label>
          <Input
            :model-value="gameUserId"
            :placeholder="t('adminUsers.detail.dialog.gameBinding.gameUserIdPlaceholder')"
            @update:model-value="emit('update:game-user-id', String($event ?? ''))"
          />
        </div>
        <div class="border rounded-lg p-3">
          <Label class="font-semibold text-sm">{{ t("adminUsers.detail.dialog.gameBinding.suiteSettings") }}</Label>
          <div class="grid gap-2 mt-2">
            <div
              v-for="option in suitePermissionOptions"
              :key="option.key"
              class="flex items-center justify-between"
            >
              <span class="text-sm">{{ t(SUITE_PERMISSION_TITLE_KEYS[option.key]) }}</span>
              <Switch
                :model-value="suite[option.key]"
                @update:model-value="emit('update:suite', { ...suite, [option.key]: !!$event })"
              />
            </div>
          </div>
        </div>
        <div class="border rounded-lg p-3">
          <Label class="font-semibold text-sm">{{ t("adminUsers.detail.dialog.gameBinding.mysekaiSettings") }}</Label>
          <div class="grid gap-2 mt-2">
            <div
              v-for="option in mysekaiPermissionOptions"
              :key="option.key"
              class="flex items-center justify-between"
            >
              <span class="text-sm">{{ t(MYSEKAI_PERMISSION_TITLE_KEYS[option.key]) }}</span>
              <Switch
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
