<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { Check, Copy, KeyRound, LucideAlertTriangle, ShieldCheck, Timer } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { copyTextToClipboard } from "@/lib/clipboard"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { useNowTick } from "@/composables/useNowTick"
import { formatInheritRemaining } from "@/modules/tools/lib/inherit-messages"

/**
 * A freshly issued (or revealed) transfer code. Big, copyable, with its
 * expiry and the single-use warning. `unsaved` turns it into the "write
 * this down now" variant for codes the vault could not keep.
 */
const props = withDefaults(defineProps<{
  inheritId: string
  password: string
  expiresAt: string | null
  /** The vault could not store this code: it cannot be shown again. */
  unsaved?: boolean
  /** The code is in the vault and can be shown again for 24 hours. */
  savedToVault?: boolean
  /** Shows what to do with the code next (restore, link a platform login, clean up). */
  nextSteps?: boolean
  /** Shows the "I have written it down" acknowledgement when set. */
  acknowledged?: boolean | null
  title?: string
  description?: string
  /** Prefix for element ids, so several cards can share a page. */
  idPrefix?: string
}>(), {
  unsaved: false,
  savedToVault: false,
  nextSteps: false,
  acknowledged: null,
  title: "",
  description: "",
  idPrefix: "inherit-new-code",
})

const emit = defineEmits<{
  (event: "acknowledge"): void
}>()

const { t } = useI18n()
const now = useNowTick(1000)

const remaining = computed(() => formatInheritRemaining(t, props.expiresAt, now.value))
const isExpired = computed(() => {
  if (!props.expiresAt) return false
  const expires = Date.parse(props.expiresAt)
  return !Number.isNaN(expires) && expires <= now.value
})

async function copy(value: string, label: string) {
  if (await copyTextToClipboard(value)) {
    toast.success(t("tools.uploadData.inheritJob.newCode.copied", { label }))
  } else {
    toast.error(t("tools.uploadData.inheritJob.newCode.copyFailed"))
  }
}

const fields = computed(() => [
  { key: "id", label: t("tools.uploadData.inheritJob.newCode.inheritId"), value: props.inheritId },
  { key: "password", label: t("tools.uploadData.inheritJob.newCode.password"), value: props.password },
])
</script>

<template>
  <section
    :class="[
      'rounded-xl border-2 p-4 sm:p-5',
      unsaved ? 'border-destructive bg-destructive/5' : 'border-emerald-500/60 bg-emerald-500/5',
    ]"
    :aria-labelledby="`${idPrefix}-title`"
    data-testid="inherit-new-code"
  >
    <div class="flex items-start gap-3">
      <component
        :is="unsaved ? LucideAlertTriangle : KeyRound"
        :class="['mt-0.5 size-5 shrink-0', unsaved ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400']"
      />
      <div class="min-w-0 space-y-1">
        <h3 :id="`${idPrefix}-title`" class="text-base font-semibold">
          {{ unsaved ? t("tools.uploadData.inheritJob.newCode.unsavedTitle") : (title || t("tools.uploadData.inheritJob.newCode.title")) }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ unsaved ? t("tools.uploadData.inheritJob.newCode.unsavedBody") : (description || t("tools.uploadData.inheritJob.newCode.description")) }}
        </p>
      </div>
    </div>

    <dl class="mt-4 grid gap-3">
      <div v-for="field in fields" :key="field.key" class="min-w-0 rounded-lg border bg-background p-3">
        <dt class="text-xs font-medium text-muted-foreground">{{ field.label }}</dt>
        <dd class="mt-1 flex items-center justify-between gap-2">
          <code
            :data-testid="`${idPrefix}-${field.key}`"
            class="min-w-0 select-all break-all font-mono text-lg font-semibold tracking-wider sm:text-xl"
          >{{ field.value }}</code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="shrink-0"
            :aria-label="t('tools.uploadData.inheritJob.newCode.copy', { label: field.label })"
            @click="copy(field.value, field.label)"
          >
            <Copy class="size-4" />
          </Button>
        </dd>
      </div>
    </dl>

    <div class="mt-3 space-y-1.5 text-sm">
      <p v-if="isExpired" class="flex items-start gap-2 font-medium text-destructive">
        <Timer class="mt-0.5 size-4 shrink-0" />
        {{ t("tools.uploadData.inheritJob.newCode.expired") }}
      </p>
      <p v-else-if="expiresAt" class="flex items-start gap-2 text-foreground">
        <Timer class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>
          {{ remaining ? t("tools.uploadData.inheritJob.newCode.expiresIn", { time: remaining }) : "" }}
          <span class="text-muted-foreground">
            · {{ t("tools.uploadData.inheritJob.newCode.expiresAt", { time: formatLocalizedDateTime(expiresAt) }) }}
          </span>
        </span>
      </p>
      <p class="flex items-start gap-2 font-medium text-amber-700 dark:text-amber-300">
        <LucideAlertTriangle class="mt-0.5 size-4 shrink-0" />
        {{ t("tools.uploadData.inheritJob.newCode.singleUse") }}
      </p>
      <p v-if="savedToVault && !unsaved" class="flex items-start gap-2 text-muted-foreground">
        <ShieldCheck class="mt-0.5 size-4 shrink-0" />
        {{ t("tools.uploadData.inheritJob.newCode.savedToVault") }}
      </p>
    </div>

    <div v-if="nextSteps" class="mt-4 space-y-1.5 border-t pt-3 text-sm" data-testid="inherit-next-steps">
      <p class="font-medium">{{ t("tools.uploadData.inheritJob.newCode.nextSteps.title") }}</p>
      <ol class="list-decimal space-y-1 ps-5 text-muted-foreground">
        <li>{{ t("tools.uploadData.inheritJob.newCode.nextSteps.restore") }}</li>
        <li data-testid="inherit-next-platform-link">{{ t("tools.uploadData.inheritJob.newCode.nextSteps.platformLink") }}</li>
        <li>{{ t("tools.uploadData.inheritJob.newCode.nextSteps.cleanup") }}</li>
      </ol>
    </div>

    <div v-if="acknowledged !== null" class="mt-4 border-t pt-3">
      <p v-if="acknowledged" class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
        <Check class="size-4" />
        {{ t("tools.uploadData.inheritJob.newCode.acked") }}
      </p>
      <Button v-else type="button" class="w-full sm:w-auto" @click="emit('acknowledge')">
        <Check class="size-4" />
        {{ t("tools.uploadData.inheritJob.newCode.ack") }}
      </Button>
    </div>
  </section>
</template>
