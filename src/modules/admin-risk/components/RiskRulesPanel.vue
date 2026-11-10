<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideAlignLeft,
  LucideCheck,
  LucideCircleAlert,
  LucideLoader2,
  LucideLock,
  LucidePencilLine,
  LucideSave,
  LucideUndo2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ErrorDescription } from "@/lib/error-utils"
import EmptyState from "@/shared/components/EmptyState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { RiskRulesDiff } from "@/modules/admin-risk/lib/rules"

/**
 * The rules as a JSON array on the left and what saving it would do on the
 * right. The heading always says where the text stands against the stored
 * rules: saved, a number of pending changes, or not valid yet.
 */
const props = defineProps<{
  userIsSuperAdmin: boolean
  rulesLoading: boolean
  rulesLoadError: ErrorDescription | null
  /** The first problem in the editor text, or null when it is a valid rule array. */
  rulesError: string | null
  /** What saving the text would do; null while the text is invalid. */
  rulesDiff: RiskRulesDiff | null
  /** The text differs from the stored rules as loaded. */
  rulesEdited: boolean
  /** Rules the save would add or change. */
  pendingChanges: number
  rulesSaving: boolean
  formatDate: (value?: string | null) => string
}>()

const rulesJson = defineModel<string>("rulesJson", { required: true })

const emit = defineEmits<{
  (event: "save"): void
  (event: "revert"): void
  (event: "format"): void
  (event: "retry"): void
}>()

const { t } = useI18n()

type EditorState = "saving" | "invalid" | "pending" | "saved"

const state = computed<EditorState>(() => {
  if (props.rulesSaving) return "saving"
  if (props.rulesError) return "invalid"
  return props.pendingChanges > 0 ? "pending" : "saved"
})

const STATE_CLASS: Record<EditorState, string> = {
  saving: "bg-muted text-muted-foreground",
  invalid: "bg-destructive/15 text-destructive-tint-foreground",
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  saved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
}

const stateLabel = computed(() => {
  switch (state.value) {
    case "saving":
      return t("adminRisk.rules.state.saving")
    case "invalid":
      return t("adminRisk.rules.state.invalid")
    case "pending":
      return t("adminRisk.rules.state.pending", {
        added: props.rulesDiff?.added ?? 0,
        changed: props.rulesDiff?.changed ?? 0,
      })
    default:
      return t("adminRisk.rules.state.saved")
  }
})

function configKeys(config: Record<string, unknown>): string[] {
  return Object.keys(config)
}

const ready = computed(() => props.userIsSuperAdmin && !props.rulesLoading && !props.rulesLoadError)
</script>

<template>
  <AdminPanel :title="t('adminRisk.rules.title')" :description="t('adminRisk.rules.description')" flush>
    <template v-if="ready" #actions>
      <span
        :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums', STATE_CLASS[state]]"
        role="status"
        data-testid="risk-rules-state"
        :data-state="state"
      >
        <LucideLoader2 v-if="state === 'saving'" class="size-3 shrink-0 animate-spin" aria-hidden="true" />
        <LucideCircleAlert v-else-if="state === 'invalid'" class="size-3 shrink-0" aria-hidden="true" />
        <LucidePencilLine v-else-if="state === 'pending'" class="size-3 shrink-0" aria-hidden="true" />
        <LucideCheck v-else class="size-3 shrink-0" aria-hidden="true" />
        {{ stateLabel }}
      </span>
    </template>

    <EmptyState v-if="!props.userIsSuperAdmin" :icon="LucideLock" :title="t('adminRisk.rules.superAdminOnly')" />
    <div v-else-if="props.rulesLoading" class="flex flex-col gap-3 p-4" aria-busy="true">
      <Skeleton class="h-64 w-full" />
    </div>
    <LoadErrorState
      v-else-if="props.rulesLoadError"
      :title="t('adminRisk.toast.loadRulesFailedTitle')"
      :description="props.rulesLoadError.message"
      :detail="props.rulesLoadError.detail"
      :retrying="props.rulesLoading"
      @retry="emit('retry')"
    />
    <div v-else class="@container">
      <div class="grid grid-cols-1 @min-[46rem]:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-1.5 p-4">
          <label for="risk-rules-editor" class="text-xs font-medium text-muted-foreground">{{ t("adminRisk.rules.editorLabel") }}</label>
          <textarea
            id="risk-rules-editor"
            v-model="rulesJson"
            class="h-80 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-base leading-relaxed shadow-xs sm:text-[13px] outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :disabled="props.rulesSaving"
            :aria-invalid="!!props.rulesError || undefined"
            :aria-describedby="props.rulesError ? 'risk-rules-editor-error' : 'risk-rules-editor-hint'"
          />
          <FieldError id="risk-rules-editor-error" :message="props.rulesError" />
          <p v-if="!props.rulesError" id="risk-rules-editor-hint" class="text-xs text-muted-foreground">
            {{ t("adminRisk.rules.editorHint") }}
          </p>
        </div>

        <!-- What the text describes, so a typo is caught before saving. -->
        <section
          class="flex min-w-0 flex-col border-t border-border/60 @min-[46rem]:border-t-0 @min-[46rem]:border-l"
          aria-labelledby="risk-rules-preview-title"
        >
          <h3 id="risk-rules-preview-title" class="flex items-baseline gap-2 px-4 pt-4 text-xs font-medium text-muted-foreground">
            {{ t("adminRisk.rules.preview.title") }}
            <span v-if="props.rulesDiff" class="font-normal tabular-nums">
              {{ t("adminRisk.rules.preview.count", { count: props.rulesDiff.entries.length }) }}
            </span>
          </h3>
          <p v-if="!props.rulesDiff" class="px-4 py-3 text-xs text-muted-foreground">{{ t("adminRisk.rules.preview.invalid") }}</p>
          <p v-else-if="props.rulesDiff.entries.length === 0" class="px-4 py-3 text-xs text-muted-foreground">
            {{ t("adminRisk.rules.preview.empty") }}
          </p>
          <ul v-else class="mt-2 max-h-96 divide-y divide-border/60 overflow-y-auto border-t border-border/60" role="list">
            <li
              v-for="entry in props.rulesDiff.entries"
              :key="entry.rule.key"
              class="px-4 py-2.5"
              :data-rule="entry.rule.key"
              :data-change="entry.change"
            >
              <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <code class="min-w-0 font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{{ entry.rule.key }}</code>
                <span
                  v-if="entry.change === 'new'"
                  class="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                >
                  {{ t("adminRisk.rules.preview.added") }}
                </span>
                <span
                  v-else-if="entry.change === 'changed'"
                  class="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300"
                >
                  {{ t("adminRisk.rules.preview.changed") }}
                </span>
              </div>
              <p v-if="entry.rule.description" class="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ entry.rule.description }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                <template v-if="configKeys(entry.rule.config).length > 0">
                  {{ t("adminRisk.rules.preview.configKeys", { keys: configKeys(entry.rule.config).join(", ") }) }}
                </template>
                <template v-else>{{ t("adminRisk.rules.preview.noConfig") }}</template>
              </p>
              <p v-if="entry.saved?.updatedAt" class="mt-0.5 text-xs tabular-nums text-muted-foreground/80 [overflow-wrap:anywhere]">
                {{ entry.saved.updatedBy
                  ? t("adminRisk.rules.preview.updatedBy", { time: props.formatDate(entry.saved.updatedAt), user: entry.saved.updatedBy })
                  : t("adminRisk.rules.preview.updatedAt", { time: props.formatDate(entry.saved.updatedAt) }) }}
              </p>
            </li>
          </ul>
          <p
            v-if="props.rulesDiff && props.rulesDiff.omitted.length > 0"
            class="border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground [overflow-wrap:anywhere]"
            data-testid="risk-rules-omitted"
          >
            {{ t("adminRisk.rules.preview.omitted", { count: props.rulesDiff.omitted.length, keys: props.rulesDiff.omitted.join(", ") }) }}
          </p>
        </section>
      </div>
    </div>

    <template v-if="ready" #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="mr-auto h-8 text-muted-foreground pointer-coarse:h-10"
          :disabled="!!props.rulesError || props.rulesSaving"
          @click="emit('format')"
        >
          <LucideAlignLeft class="size-4" aria-hidden="true" />
          {{ t("adminRisk.rules.formatButton") }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 pointer-coarse:h-10"
          :disabled="!props.rulesEdited || props.rulesSaving"
          @click="emit('revert')"
        >
          <LucideUndo2 class="size-4" aria-hidden="true" />
          {{ t("adminRisk.rules.revertButton") }}
        </Button>
        <Button
          size="sm"
          class="h-8 pointer-coarse:h-10"
          :disabled="props.rulesSaving || !!props.rulesError || props.pendingChanges === 0"
          @click="emit('save')"
        >
          <LucideLoader2 v-if="props.rulesSaving" class="size-4 animate-spin" aria-hidden="true" />
          <LucideSave v-else class="size-4" aria-hidden="true" />
          {{ t("adminRisk.rules.saveButton") }}
        </Button>
      </div>
    </template>
  </AdminPanel>
</template>
