<script setup lang="ts">
/**
 * JSON editor for the system config cards. Monaco loads from a CDN; when that
 * fails (blocked CDN, offline) the editor's failure slot offers a plain
 * `<textarea>` mode so the page stays usable. There is deliberately no retry
 * button: `@monaco-editor/loader` keeps one module-level init promise, so a
 * failed load stays failed until the page reloads. The plain mode can also be
 * chosen directly from the header.
 */
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { VueMonacoEditor } from "@guolao/vue-monaco-editor"
import { LucideCode2, LucideFileText } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import { useSettingsStore } from "@/shared/stores/settings"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  modelValue: string
  /** The textarea's id, also the anchor of its inline error. */
  id: string
  /** Monaco editor options; `automaticLayout` is always on. */
  options?: Record<string, unknown>
  /** Tailwind height class of the editor box (it is user-resizable). */
  heightClass?: string
  validationError?: string | null
  disabled?: boolean
}>(), {
  options: () => ({}),
  heightClass: "h-64",
  validationError: null,
  disabled: false,
})

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)

const monacoTheme = computed(() => {
  if (theme.value === "dark") return "vs-dark"
  if (theme.value === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs"
  }
  return "vs"
})

const monacoOptions = computed(() => ({ ...props.options, automaticLayout: true, readOnly: props.disabled }))

const plainMode = ref(false)

function handleEditorInput(value: string | undefined) {
  emit("update:modelValue", value ?? "")
}

function handleTextareaInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value)
}

const errorId = computed(() => `${props.id}-error`)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
        :aria-pressed="plainMode"
        @click="plainMode = !plainMode"
      >
        <LucideCode2 v-if="plainMode" class="h-3.5 w-3.5" aria-hidden="true" />
        <LucideFileText v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ plainMode ? t("adminConfig.editor.useCodeEditor") : t("adminConfig.editor.usePlainEditor") }}
      </Button>
    </div>

    <textarea
      v-if="plainMode"
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      :aria-invalid="validationError ? true : undefined"
      :aria-describedby="validationError ? errorId : undefined"
      :class="cn(
        'min-h-40 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        heightClass,
      )"
      @input="handleTextareaInput"
    />
    <div
      v-else
      :class="cn(
        'max-h-[70vh] min-h-40 w-full resize-y overflow-hidden rounded-md border shadow-sm',
        validationError ? 'border-destructive' : 'border-input',
        heightClass,
      )"
    >
      <VueMonacoEditor
        :value="modelValue"
        language="json"
        :theme="monacoTheme"
        :options="monacoOptions"
        @update:value="handleEditorInput"
      >
        <template #default>
          <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
            {{ t("adminConfig.editor.loading") }}
          </div>
        </template>
        <template #failure>
          <div class="flex h-full flex-col items-center justify-center overflow-y-auto">
            <LoadErrorState
              :title="t('adminConfig.editor.loadFailedTitle')"
              :description="t('adminConfig.editor.loadFailedDescription')"
              :retryable="false"
            />
            <Button type="button" variant="secondary" size="sm" class="mb-6" @click="plainMode = true">
              <LucideFileText class="h-4 w-4" aria-hidden="true" />
              {{ t("adminConfig.editor.usePlainEditor") }}
            </Button>
          </div>
        </template>
      </VueMonacoEditor>
    </div>
    <FieldError :id="errorId" :message="validationError" />
  </div>
</template>
