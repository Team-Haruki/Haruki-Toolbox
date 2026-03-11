<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check } from "lucide-vue-next"

const { t } = useI18n()

defineProps<{
  open: boolean
  generatedCode: string
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "copy"): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.verifyDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("userSettings.gameBinding.verifyDialog.description") }}<br>{{ t("userSettings.gameBinding.verifyDialog.copyHint") }}
        </DialogDescription>
      </DialogHeader>
      <div
        class="text-center text-2xl font-bold py-4 select-all cursor-pointer"
        @click="emit('copy')"
      >
        {{ generatedCode }}
      </div>
      <DialogDescription>
        {{ t("userSettings.gameBinding.verifyDialog.notice.keepFullCode") }}<br>
        {{ t("userSettings.gameBinding.verifyDialog.notice.returnHome") }}<br>
        {{ t("userSettings.gameBinding.verifyDialog.notice.saveAfterClose") }}
      </DialogDescription>
      <DialogFooter>
        <DialogClose as-child>
          <Button>
            <Check class="h-4 w-4 mr-2" />
            {{ t("userSettings.gameBinding.verifyDialog.confirmButton") }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
