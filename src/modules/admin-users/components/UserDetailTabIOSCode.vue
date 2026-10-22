<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
    LucideQrCode,
    LucideRefreshCw,
    LucideTrash2,
} from "lucide-vue-next"

/**
 * Both actions reject on failure so the confirm dialog can stay open and show
 * the error inline. `regenerate` also serves the first "generate" (no code
 * yet), which runs without confirmation and reports failures itself.
 */
export interface UserDetailIOSCodeActions {
    regenerate: () => Promise<void>
    delete: () => Promise<void>
}

type PendingAction = "regenerate" | "delete"

const props = defineProps<{
    uploadCode: string | null
    userName: string
    busy: boolean
    actions: UserDetailIOSCodeActions
}>()

const { t } = useI18n()

const confirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pending = ref<PendingAction | null>(null)

function requestConfirm(action: PendingAction) {
    pending.value = action
    confirmOpen.value = true
}

const confirmDialog = computed(() => {
    switch (pending.value) {
        case "regenerate":
            return {
                title: t("adminUsers.detail.ios.regenerateDialogTitle"),
                description: t("adminUsers.detail.ios.regenerateDialogDescription", { name: props.userName }),
                confirmLabel: t("adminUsers.detail.ios.regenerateDialogConfirm"),
                destructive: false,
                run: () => props.actions.regenerate(),
            }
        case "delete":
            return {
                title: t("adminUsers.detail.ios.deleteDialogTitle"),
                description: t("adminUsers.detail.ios.deleteDialogDescription"),
                confirmLabel: t("adminUsers.common.confirm"),
                destructive: true,
                run: () => props.actions.delete(),
            }
        default:
            return null
    }
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t("adminUsers.detail.ios.title") }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="uploadCode" class="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-lg">
        <code class="text-sm font-mono tabular-nums bg-muted px-2 py-1 rounded">{{ uploadCode }}</code>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="busy" @click="requestConfirm('regenerate')">
            <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.regenerate") }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive hover:text-destructive"
            :disabled="busy"
            :title="t('adminUsers.detail.info.delete')"
            :aria-label="t('adminUsers.detail.info.delete')"
            @click="requestConfirm('delete')"
          >
            <LucideTrash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
        <LucideQrCode class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.ios.empty") }}</p>
        <Button variant="outline" size="sm" :disabled="busy" @click="actions.regenerate()">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.generate") }}
        </Button>
      </div>
    </CardContent>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmDialog?.title ?? ''"
      :description="confirmDialog?.description ?? ''"
      :confirm-label="confirmDialog?.confirmLabel"
      :destructive="confirmDialog?.destructive ?? false"
      :on-confirm="confirmDialog?.run"
    />
  </Card>
</template>
