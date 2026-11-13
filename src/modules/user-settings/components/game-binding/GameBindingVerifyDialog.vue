<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy } from "lucide-vue-next"

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
    <DialogContent size="sm" :description="t('userSettings.gameBinding.verifyDialog.description')">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.verifyDialog.title") }}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <!-- The code is the one thing to read here: large, selectable, with its copy button beside it. -->
        <div class="flex flex-col gap-1">
          <p class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.verifyDialog.codeLabel") }}</p>
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p class="min-w-0 select-all font-mono text-2xl font-semibold tabular-nums [overflow-wrap:anywhere]" data-testid="binding-verify-code">
              {{ generatedCode }}
            </p>
            <Button variant="outline" size="sm" class="shrink-0" @click="emit('copy')">
              <Copy class="size-4" aria-hidden="true" />
              {{ t("userSettings.gameBinding.verifyDialog.copyButton") }}
            </Button>
          </div>
        </div>

        <ol class="list-decimal space-y-1.5 border-t border-border/60 pt-4 pl-5 text-sm text-muted-foreground">
          <li v-for="step in STEP_KEYS" :key="step">
            {{ t(`userSettings.gameBinding.verifyDialog.steps.${step}`) }}
          </li>
        </ol>
        <p class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.verifyDialog.afterwards") }}</p>
      </DialogBody>

      <DialogFooter>
        <DialogClose as-child>
          <Button>{{ t("userSettings.gameBinding.verifyDialog.confirmButton") }}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
