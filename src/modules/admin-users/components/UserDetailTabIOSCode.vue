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
          <Button variant="ghost" size="sm" class="text-destructive" :disabled="busy" @click="emit('delete')">
            <LucideTrash2 class="w-4 h-4" />
          </Button>
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
