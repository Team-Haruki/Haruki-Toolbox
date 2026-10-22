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
import { Check, Copy } from "lucide-vue-next"

const { t } = useI18n()

defineProps<{
  open: boolean
  generatedCode: string
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "copy"): void
}>()

const STEP_KEYS = ["copy", "paste", "returnHome", "save"] as const
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.verifyDialog.title") }}</DialogTitle>
        <DialogDescription>{{ t("userSettings.gameBinding.verifyDialog.description") }}</DialogDescription>
      </DialogHeader>

      <div class="rounded-lg border bg-muted/30 px-3 py-4">
        <p class="text-center text-xs text-muted-foreground">{{ t("userSettings.gameBinding.verifyDialog.codeLabel") }}</p>
        <p class="mt-1 select-all break-all text-center font-mono text-2xl font-bold" data-testid="binding-verify-code">
          {{ generatedCode }}
        </p>
        <div class="mt-3 flex justify-center">
          <Button variant="outline" size="sm" @click="emit('copy')">
            <Copy class="h-4 w-4 mr-2" aria-hidden="true" />
            {{ t("userSettings.gameBinding.verifyDialog.copyButton") }}
          </Button>
        </div>
      </div>

      <ol class="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li v-for="step in STEP_KEYS" :key="step">
          {{ t(`userSettings.gameBinding.verifyDialog.steps.${step}`) }}
        </li>
      </ol>
      <p class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.verifyDialog.afterwards") }}</p>

      <DialogFooter>
        <DialogClose as-child>
          <Button>
            <Check class="h-4 w-4 mr-2" aria-hidden="true" />
            {{ t("userSettings.gameBinding.verifyDialog.confirmButton") }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
