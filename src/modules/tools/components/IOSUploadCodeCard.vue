<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
    <div class="space-y-1">
      <h2 class="flex items-center gap-2 text-base font-semibold">
        <KeyRound class="size-4" />
        {{ t("tools.iosModules.uploadCode.title") }}
      </h2>
      <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.uploadCode.description") }}</p>
    </div>

    <div v-if="hasUploadCode" class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div class="flex min-w-0 items-center rounded-md border bg-background shadow-sm">
        <Input
          :model-value="uploadCode ?? ''"
          readonly
          class="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
        />
        <Button class="mr-1 shrink-0" variant="ghost" size="icon" @click="handleCopyUploadCode">
          <Copy class="size-4" />
        </Button>
      </div>
      <Button class="shrink-0" variant="outline" :disabled="isGeneratingCode || !isLoggedIn" @click="emit('generate')">
        <RefreshCw class="mr-1 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
        {{ t("tools.iosModules.uploadCode.regenerate") }}
      </Button>
    </div>
    <div v-else>
      <Button class="w-full sm:w-auto" :disabled="isGeneratingCode || !isLoggedIn" @click="emit('generate')">
        <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
        {{ isLoggedIn ? t("tools.iosModules.uploadCode.generate") : t("tools.iosModules.uploadCode.loginRequired") }}
      </Button>
    </div>
  </section>
</template>
