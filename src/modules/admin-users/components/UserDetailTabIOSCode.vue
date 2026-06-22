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
      <div v-if="uploadCode" class="flex items-center justify-between p-4 border rounded-lg">
        <code class="text-sm font-mono bg-muted px-2 py-1 rounded">{{ uploadCode }}</code>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="busy" @click="emit('regenerate')">
            <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.regenerate") }}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-destructive" :disabled="busy">
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
      <div v-else class="flex flex-col items-center gap-3 py-8">
        <p class="text-muted-foreground">{{ t("adminUsers.detail.ios.empty") }}</p>
        <Button variant="outline" size="sm" :disabled="busy" @click="emit('regenerate')">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.ios.generate") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
