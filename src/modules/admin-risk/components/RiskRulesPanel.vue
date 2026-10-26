<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideLoader2,
  LucideLock,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { RiskRule } from "@/types/admin"

interface Props {
  userIsSuperAdmin: boolean
  rulesLoading: boolean
  rulesLoadError: ErrorDescription | null
  rulesJson: string
  /** The first problem in the editor text, or null when it is a valid rule array. */
  rulesError: string | null
  /** The rules the editor text currently describes (empty while invalid). */
  rulesPreview: RiskRule[]
  rulesDirty: boolean
  rulesSaving: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  (event: "update:rulesJson", value: string): void
  (event: "save"): void
  (event: "retry"): void
}>()

function configKeys(rule: RiskRule): string[] {
  return rule.config ? Object.keys(rule.config) : []
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">{{ t("adminRisk.rules.title") }}</CardTitle>
      <CardDescription>{{ t("adminRisk.rules.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <template v-if="!props.userIsSuperAdmin">
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <LucideLock class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">
            {{ t("adminRisk.rules.superAdminOnly") }}
          </p>
        </div>
      </template>
      <template v-else-if="props.rulesLoading">
        <Skeleton class="h-64 w-full" />
        <Skeleton class="h-9 w-24 self-end" />
      </template>
      <template v-else-if="props.rulesLoadError">
        <LoadErrorState
          :title="t('adminRisk.toast.loadRulesFailedTitle')"
          :description="props.rulesLoadError.message"
          :detail="props.rulesLoadError.detail"
          :retrying="props.rulesLoading"
          @retry="emit('retry')"
        />
      </template>
      <template v-else>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <textarea
              id="risk-rules-editor"
              :value="props.rulesJson"
              class="w-full h-72 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
              spellcheck="false"
              :aria-label="t('adminRisk.rules.title')"
              :aria-invalid="!!props.rulesError || undefined"
              :aria-describedby="props.rulesError ? 'risk-rules-editor-error' : undefined"
              @input="emit('update:rulesJson', String(($event.target as HTMLTextAreaElement).value))"
            />
            <FieldError id="risk-rules-editor-error" :message="props.rulesError" />
          </div>

          <!-- Preview of what the text describes, so a typo is caught before saving. -->
          <section class="flex flex-col gap-2 rounded-md border bg-muted/20 p-3" aria-labelledby="risk-rules-preview-title">
            <h3 id="risk-rules-preview-title" class="text-sm font-medium">
              {{ t("adminRisk.rules.preview.title") }}
              <span class="ml-1 text-xs font-normal text-muted-foreground tabular-nums">
                {{ t("adminRisk.rules.preview.count", { count: props.rulesPreview.length }) }}
              </span>
            </h3>
            <p v-if="props.rulesError" class="text-xs text-muted-foreground">{{ t("adminRisk.rules.preview.invalid") }}</p>
            <p v-else-if="props.rulesPreview.length === 0" class="text-xs text-muted-foreground">{{ t("adminRisk.rules.preview.empty") }}</p>
            <ul v-else class="flex max-h-72 flex-col gap-2 overflow-auto" role="list">
              <li v-for="rule in props.rulesPreview" :key="rule.id" class="rounded-md border bg-card px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium">{{ rule.name }}</span>
                  <code class="rounded bg-muted px-1 py-0.5 text-[11px]">{{ rule.id }}</code>
                  <Badge :variant="rule.enabled ? 'emerald' : 'muted'" class="px-2 py-0.5 text-[11px]">
                    {{ rule.enabled ? t("adminRisk.rules.preview.enabled") : t("adminRisk.rules.preview.disabled") }}
                  </Badge>
                </div>
                <p v-if="rule.description" class="mt-1 text-xs text-muted-foreground break-words">{{ rule.description }}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  <template v-if="configKeys(rule).length > 0">
                    {{ t("adminRisk.rules.preview.configKeys", { keys: configKeys(rule).join(", ") }) }}
                  </template>
                  <template v-else>{{ t("adminRisk.rules.preview.noConfig") }}</template>
                </p>
              </li>
            </ul>
          </section>
        </div>
        <Button
          class="self-end"
          :disabled="props.rulesSaving || !!props.rulesError || !props.rulesDirty"
          @click="emit('save')"
        >
          <LucideLoader2 v-if="props.rulesSaving" class="w-4 h-4 animate-spin" />
          {{ t("adminRisk.rules.saveButton") }}
        </Button>
      </template>
    </CardContent>
  </Card>
</template>
