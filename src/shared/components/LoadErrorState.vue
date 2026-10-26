<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw, LucideTriangleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

/**
 * The shared "this section failed to load" state: an icon, a title, a
 * user-language description, an optional smaller raw detail (e.g. the
 * `detail` of `describeError`) and a retry button. Defaults come from
 * `core.loadError.*`; pass `description`/`detail` from `describeError(err, …)`.
 */
withDefaults(defineProps<{
  title?: string | null
  description?: string | null
  detail?: string | null
  retryLabel?: string | null
  retrying?: boolean
  /** Hide the retry button when the caller cannot retry. */
  retryable?: boolean
}>(), {
  title: null,
  description: null,
  detail: null,
  retryLabel: null,
  retrying: false,
  retryable: true,
})

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>

<template>
  <div data-slot="load-error-state" class="flex flex-col items-center gap-3 py-10 text-center" role="alert">
    <LucideTriangleAlert class="size-8 text-destructive/70" aria-hidden="true" />
    <div class="space-y-1">
      <p class="text-sm font-medium">{{ title ?? t("core.loadError.title") }}</p>
      <p class="max-w-md text-sm text-muted-foreground">{{ description ?? t("core.loadError.description") }}</p>
      <p v-if="detail" class="max-w-md break-words text-xs text-muted-foreground/80" :title="detail">
        {{ t("core.errors.detail", { detail }) }}
      </p>
    </div>
    <Button v-if="retryable" variant="outline" size="sm" :disabled="retrying" @click="emit('retry')">
      <LucideRefreshCcw :class="['size-4', retrying ? 'animate-spin' : '']" aria-hidden="true" />
      {{ retryLabel ?? t("core.loadError.retry") }}
    </Button>
  </div>
</template>
