<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    LucideQrCode,
    LucideRefreshCw,
    LucideTrash2,
} from "lucide-vue-next"

defineProps<{
    uploadCode: string | null
    busy: boolean
}>()

const emit = defineEmits<{
    (e: "regenerate"): void
    (e: "delete"): void
}>()

const { t } = useI18n()
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
          <Button variant="outline" size="sm" :disabled="busy" @click="emit('regenerate')">
            <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.regenerate") }}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                :disabled="busy"
                :title="t('adminUsers.detail.info.delete')"
                :aria-label="t('adminUsers.detail.info.delete')"
              >
                <LucideTrash2 class="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t("adminUsers.detail.ios.deleteDialogTitle") }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ t("adminUsers.detail.ios.deleteDialogDescription") }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
                <AlertDialogAction @click="emit('delete')">{{ t("adminUsers.common.confirm") }}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
        <LucideQrCode class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.ios.empty") }}</p>
        <Button variant="outline" size="sm" :disabled="busy" @click="emit('regenerate')">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.generate") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
