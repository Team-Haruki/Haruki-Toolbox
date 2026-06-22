<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideLoader2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

interface Props {
  userIsSuperAdmin: boolean
  rulesLoading: boolean
  rulesLoadError: boolean
  rulesJson: string
  rulesSaving: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  (event: "update:rulesJson", value: string): void
  (event: "save"): void
  (event: "retry"): void
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">{{ t("adminRisk.rules.title") }}</CardTitle>
      <CardDescription>{{ t("adminRisk.rules.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <template v-if="!props.userIsSuperAdmin">
        <p class="text-sm text-muted-foreground py-8 text-center">
          {{ t("adminRisk.rules.superAdminOnly") }}
        </p>
      </template>
      <template v-else-if="props.rulesLoading">
        <Skeleton class="h-48 w-full" />
      </template>
      <template v-else-if="props.rulesLoadError">
        <div class="flex flex-col items-center gap-3 py-8 text-center">
          <p class="text-sm text-muted-foreground">{{ t("adminRisk.rules.loadError") }}</p>
          <Button variant="outline" size="sm" @click="emit('retry')">
            {{ t("adminRisk.rules.retry") }}
          </Button>
        </div>
      </template>
      <template v-else>
        <textarea
          :value="props.rulesJson"
          class="w-full h-64 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y disabled:opacity-60"
          spellcheck="false"
          @input="emit('update:rulesJson', String(($event.target as HTMLTextAreaElement).value))"
        />
        <Button
          class="self-end"
          :disabled="props.rulesSaving"
          @click="emit('save')"
        >
          <LucideLoader2 v-if="props.rulesSaving" class="w-4 h-4 mr-1 animate-spin" />
          {{ t("adminRisk.rules.saveButton") }}
        </Button>
      </template>
    </CardContent>
  </Card>
</template>
