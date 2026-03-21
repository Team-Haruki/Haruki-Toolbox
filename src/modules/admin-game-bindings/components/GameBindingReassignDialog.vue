<script setup lang="ts">
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
import { LucideArrowRightLeft } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"

defineProps<{
  open: boolean
  target: GlobalGameBinding | null
  targetUserId: string
  actionLoading: boolean
  serverLabel: (server: string) => string
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:targetUserId", value: string): void
  (e: "confirm"): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminGameBindings.reassignDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminGameBindings.reassignDialog.descriptionPrefix") }}
          {{ serverLabel(target?.server ?? "") }}
          {{ t("adminGameBindings.reassignDialog.gameIdLabel") }}
          <strong>{{ target?.gameUserId }}</strong>
          {{ t("adminGameBindings.reassignDialog.descriptionMiddle") }}
          {{ target?.userName || target?.userId }}
          {{ t("adminGameBindings.reassignDialog.descriptionSuffix") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-2 py-2">
        <Label>{{ t("adminGameBindings.reassignDialog.targetUserIdLabel") }}</Label>
        <Input
          :model-value="targetUserId"
          :placeholder="t('adminGameBindings.reassignDialog.targetUserIdPlaceholder')"
          @update:model-value="emit('update:targetUserId', String($event ?? ''))"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminGameBindings.common.cancel") }}</Button>
        <Button
          @click="emit('confirm')"
          :disabled="!targetUserId.trim() || actionLoading"
        >
          <LucideArrowRightLeft class="w-4 h-4 mr-1" />
          {{ t("adminGameBindings.reassignDialog.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
