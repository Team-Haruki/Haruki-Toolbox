<script setup lang="ts">
import { computed } from "vue"
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
import { useI18n } from "vue-i18n"
import {
  isMysekaiPermissionKey,
  MYSEKAI_PERMISSION_TITLE_KEYS,
  isSuitePermissionKey,
  SUITE_PERMISSION_TITLE_KEYS,
  MYSEKAI_PERMISSION_OPTIONS,
  SUITE_PERMISSION_OPTIONS,
} from "@/lib/game-binding-permission-meta"
import { isSekaiRegion } from "@/lib/sekai-region"
import type { SekaiRegion } from "@/types/store"
import GameBindingPermissionSection from "./GameBindingPermissionSection.vue"

type ServerOption = {
  value: SekaiRegion
  label: string
}

defineProps<{
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

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:editTargetUserId", value: string): void
  (e: "update:editServer", value: SekaiRegion): void
  (e: "update:editGameUserId", value: string): void
  (e: "update:suite", payload: { key: string; value: boolean }): void
  (e: "update:mysekai", payload: { key: string; value: boolean }): void
  (e: "save"): void
}>()

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  emit("update:editServer", value)
}

function handleSuitePermissionUpdate(payload: { key: string; value: boolean }) {
  if (!isSuitePermissionKey(payload.key)) return
  emit("update:suite", payload)
}

function handleMysekaiPermissionUpdate(payload: { key: string; value: boolean }) {
  if (!isMysekaiPermissionKey(payload.key)) return
  emit("update:mysekai", payload)
}

const suitePermissionOptions = computed(() =>
  SUITE_PERMISSION_OPTIONS.map((option) => ({
    key: option.key,
    label: t(SUITE_PERMISSION_TITLE_KEYS[option.key]),
  }))
)

const mysekaiPermissionOptions = computed(() =>
  MYSEKAI_PERMISSION_OPTIONS.map((option) => ({
    key: option.key,
    label: t(MYSEKAI_PERMISSION_TITLE_KEYS[option.key]),
  }))
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEditMode ? t("adminGameBindings.editDialog.editTitle") : t("adminGameBindings.editDialog.createTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ isEditMode ? t("adminGameBindings.editDialog.editDescription") : t("adminGameBindings.editDialog.createDescription") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminGameBindings.editDialog.toolboxUserId") }}</Label>
          <Input
            :model-value="editTargetUserId"
            :placeholder="t('adminGameBindings.editDialog.toolboxUserIdPlaceholder')"
            :disabled="isEditMode"
            @update:model-value="emit('update:editTargetUserId', String($event ?? ''))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminGameBindings.editDialog.server") }}</Label>
          <Select :key="locale" :model-value="editServer" @update:model-value="handleServerChange">
            <SelectTrigger class="w-full" :disabled="isEditMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in editServers"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminGameBindings.editDialog.gameUserId") }}</Label>
          <Input
            :model-value="editGameUserId"
            :placeholder="t('adminGameBindings.editDialog.gameUserIdPlaceholder')"
            :disabled="isEditMode"
            @update:model-value="emit('update:editGameUserId', String($event ?? ''))"
          />
        </div>
        <GameBindingPermissionSection
          :title="t('adminGameBindings.editDialog.suiteSettingsTitle')"
          :options="suitePermissionOptions"
          :values="editSuite"
          @update="handleSuitePermissionUpdate"
        />
        <GameBindingPermissionSection
          :title="t('adminGameBindings.editDialog.mysekaiSettingsTitle')"
          :options="mysekaiPermissionOptions"
          :values="editMysekai"
          @update="handleMysekaiPermissionUpdate"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminGameBindings.common.cancel") }}</Button>
        <Button
          @click="emit('save')"
          :disabled="!editTargetUserId.trim() || !editGameUserId.trim() || actionLoading"
        >
          {{ isEditMode ? t("common.save") : t("adminGameBindings.common.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
