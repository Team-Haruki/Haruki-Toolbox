<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Link2 } from "lucide-vue-next"

const { t } = useI18n()

withDefaults(
  defineProps<{
    moduleUrl: string
    scriptUrl?: string | null
    showScriptUrl: boolean
  }>(),
  {
    scriptUrl: null,
  }
)

const emit = defineEmits<{
  (event: "copyModuleUrl", value: string): void
  (event: "copyScriptUrl", value: string): void
}>()
</script>

<template>
  <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
    <div class="space-y-1">
      <h2 class="flex items-center gap-2 text-base font-semibold">
        <Link2 class="size-4" />
        {{ t("tools.iosModules.generatedUrls.title") }}
      </h2>
      <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.generatedUrls.description") }}</p>
    </div>
    <div class="space-y-3">
      <div>
        <Label class="text-sm font-medium">{{ t("tools.iosModules.generatedUrls.moduleUrl") }}</Label>
        <div class="flex items-center gap-2 mt-1">
          <Input :model-value="moduleUrl" readonly class="min-w-0 font-mono text-xs" />
          <Button variant="outline" size="icon" @click="emit('copyModuleUrl', moduleUrl)">
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div v-if="showScriptUrl && scriptUrl">
        <Label class="text-sm font-medium">{{ t("tools.iosModules.generatedUrls.scriptUrl") }}</Label>
        <div class="flex items-center gap-2 mt-1">
          <Input :model-value="scriptUrl" readonly class="min-w-0 font-mono text-xs" />
          <Button variant="outline" size="icon" @click="emit('copyScriptUrl', scriptUrl)">
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>
