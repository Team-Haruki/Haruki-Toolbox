<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, KeyRound, RefreshCw } from "lucide-vue-next"

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    uploadCode?: string | null
    hasUploadCode: boolean
    isGeneratingCode: boolean
    isLoggedIn: boolean
  }>(),
  {
    uploadCode: null,
  }
)

const emit = defineEmits<{
  (event: "generate"): void
  (event: "copyUploadCode", value: string): void
}>()

function handleCopyUploadCode() {
  if (!props.uploadCode) return
  emit("copyUploadCode", props.uploadCode)
}
</script>

<template>
  <Card>
    <CardHeader class="pb-1">
      <CardTitle class="text-base flex items-center gap-2">
        <KeyRound class="h-4 w-4" />
        {{ t("tools.iosModules.uploadCode.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.iosModules.uploadCode.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="hasUploadCode" class="flex items-center gap-2">
        <Input :model-value="uploadCode ?? ''" readonly class="font-mono text-sm" />
        <Button variant="outline" size="icon" @click="handleCopyUploadCode">
          <Copy class="w-4 h-4" />
        </Button>
        <Button variant="outline" :disabled="isGeneratingCode || !isLoggedIn" @click="emit('generate')">
          <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': isGeneratingCode }" />
          {{ t("tools.iosModules.uploadCode.regenerate") }}
        </Button>
      </div>
      <div v-else>
        <Button class="w-full" :disabled="isGeneratingCode || !isLoggedIn" @click="emit('generate')">
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isGeneratingCode }" />
          {{ isLoggedIn ? t("tools.iosModules.uploadCode.generate") : t("tools.iosModules.uploadCode.loginRequired") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
