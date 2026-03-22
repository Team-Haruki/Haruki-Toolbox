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
import { LucideLoader2, LucideTrash2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  open: boolean
  deleting: boolean
  deleteTargetId: string
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "confirm"): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminWebhooks.deleteDialog.title") }}</DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ t("adminWebhooks.deleteDialog.description", { id: props.deleteTargetId }) }}
        </p>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">{{ t("adminWebhooks.actions.cancel") }}</Button>
        </DialogClose>
        <Button variant="destructive" :disabled="props.deleting" @click="emit('confirm')">
          <LucideLoader2 v-if="props.deleting" class="w-4 h-4 mr-2 animate-spin" />
          <LucideTrash2 v-else class="w-4 h-4 mr-2" />
          {{ t("adminWebhooks.deleteDialog.confirm") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
