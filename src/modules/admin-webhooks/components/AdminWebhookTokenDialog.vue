<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LucideCopy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  open: boolean
  token: string
  tokenHeaderName: string
  webhookId: string
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "copy"): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminWebhooks.tokenDialog.title") }}</DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ t("adminWebhooks.tokenDialog.description", { id: props.webhookId }) }}
        </p>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label>{{ t("adminWebhooks.tokenDialog.headerNameLabel") }}</Label>
          <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono">
            {{ props.tokenHeaderName }}
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t("adminWebhooks.tokenDialog.tokenLabel") }}</Label>
          <div class="max-h-56 overflow-auto rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono break-all select-all">
            {{ props.token }}
          </div>
          <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.tokenHelp") }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('copy')">
          <LucideCopy class="w-4 h-4 mr-2" />
          {{ t("adminWebhooks.actions.copyToken") }}
        </Button>
        <DialogClose as-child>
          <Button>{{ t("adminWebhooks.tokenDialog.close") }}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
