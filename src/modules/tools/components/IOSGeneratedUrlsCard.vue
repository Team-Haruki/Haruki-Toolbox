<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  <Card>
    <CardHeader class="pb-1">
      <CardTitle class="text-base flex items-center gap-2">
        <Link2 class="h-4 w-4" />
        {{ t("tools.iosModules.generatedUrls.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.iosModules.generatedUrls.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <div>
        <Label class="text-sm font-medium">{{ t("tools.iosModules.generatedUrls.moduleUrl") }}</Label>
        <div class="flex items-center gap-2 mt-1">
          <Input :model-value="moduleUrl" readonly class="font-mono text-xs" />
          <Button variant="outline" size="icon" @click="emit('copyModuleUrl', moduleUrl)">
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div v-if="showScriptUrl && scriptUrl">
        <Label class="text-sm font-medium">{{ t("tools.iosModules.generatedUrls.scriptUrl") }}</Label>
        <div class="flex items-center gap-2 mt-1">
          <Input :model-value="scriptUrl" readonly class="font-mono text-xs" />
          <Button variant="outline" size="icon" @click="emit('copyScriptUrl', scriptUrl)">
            <Copy class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
