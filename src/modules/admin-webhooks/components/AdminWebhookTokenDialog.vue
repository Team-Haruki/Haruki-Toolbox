<script setup lang="ts">
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { LucideCopy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

// The token is shown exactly once, so the dialog cannot be dismissed by
// accident: only the "I have saved it" button closes it.
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
  <ConfirmDialog
    :open="props.open"
    non-dismissable
    :title="t('adminWebhooks.tokenDialog.title')"
    :description="t('adminWebhooks.tokenDialog.description', { id: props.webhookId })"
    :confirm-label="t('adminWebhooks.tokenDialog.confirmSaved')"
    @update:open="emit('update:open', $event)"
  >
    <div class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-muted/20">
      <div class="px-4 py-3">
        <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.headerNameLabel") }}</p>
        <p class="mt-1 font-mono text-sm [overflow-wrap:anywhere]">{{ props.tokenHeaderName }}</p>
      </div>
      <div class="px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.tokenLabel") }}</p>
          <Button variant="outline" size="sm" class="h-7 shrink-0 gap-1 px-2 text-xs pointer-coarse:h-10" @click="emit('copy')">
            <LucideCopy class="size-3.5" />
            {{ t("adminWebhooks.actions.copyToken") }}
          </Button>
        </div>
        <p class="mt-1 max-h-56 overflow-auto font-mono text-sm select-all [overflow-wrap:anywhere]">{{ props.token }}</p>
        <p class="mt-2 text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.tokenHelp") }}</p>
      </div>
    </div>
  </ConfirmDialog>
</template>
