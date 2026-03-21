<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, X } from "lucide-vue-next"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"

const { t } = useI18n()

defineProps<{
  open: boolean
  deleteTarget: GameAccountBinding | null
  regionLabels: Record<SekaiRegion, string>
  isDeleting: boolean
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "confirm"): void
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("userSettings.gameBinding.deleteDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("userSettings.gameBinding.deleteDialog.description", {
            server: deleteTarget ? regionLabels[deleteTarget.server] ?? deleteTarget.server : "",
            userId: deleteTarget?.userId ?? "",
          }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          {{ t("userSettings.common.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive text-foreground" :disabled="isDeleting" @click="emit('confirm')">
          <Trash2 class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.actions.delete") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
