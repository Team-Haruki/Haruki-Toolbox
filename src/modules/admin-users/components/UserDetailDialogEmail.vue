<script setup lang="ts">
import { useI18n } from "vue-i18n"
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

defineProps<{
    open: boolean
    userName?: string
    email: string
    actionLoading: boolean
}>()

const emit = defineEmits<{
    (e: "update:open", value: boolean): void
    (e: "update:email", value: string): void
    (e: "save"): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminUsers.detail.dialog.email.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminUsers.detail.dialog.email.description", { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminUsers.detail.dialog.email.newEmail") }}</Label>
          <Input
            :model-value="email"
            :placeholder="t('adminUsers.detail.dialog.email.placeholder')"
            type="email"
            @update:model-value="emit('update:email', String($event ?? ''))"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button @click="emit('save')" :disabled="!email.trim() || actionLoading">
          {{ t("adminUsers.detail.dialog.email.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
