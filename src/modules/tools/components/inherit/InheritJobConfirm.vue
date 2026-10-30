<script setup lang="ts">
import { computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Loader2, ShieldCheck, Smartphone, Timer, UserRound, X } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { useNowTick } from "@/composables/useNowTick"
import { toInheritApiError } from "@/modules/tools/api/inherit"
import type { InheritJob } from "@/modules/tools/lib/inherit-job"
import type { InheritUnlockInput } from "@/modules/tools/lib/inherit-vault"
import { formatInheritRemaining } from "@/modules/tools/lib/inherit-messages"
import { useInheritUnlock } from "@/modules/tools/composables/useInheritUnlock"
import InheritUnlockFields from "@/modules/tools/components/inherit/InheritUnlockFields.vue"

/**
 * The pause after the preview: who the account is, what executing does to
 * the phone it lives on, and the step-up that both confirms and unlocks the
 * vault the credential will be sealed into.
 */
const props = defineProps<{
  job: InheritJob
  pending: "confirm" | "cancel" | null
  onConfirm: (unlock: InheritUnlockInput) => Promise<void>
  onCancel: () => Promise<void>
}>()

const emit = defineEmits<{
  (event: "reset-vault"): void
}>()

const { t } = useI18n()
const now = useNowTick(1000)
const unlock = useInheritUnlock()

watch(
  () => [props.job.unlock?.kind, props.job.unlock?.initialized] as const,
  ([kind, initialized]) => unlock.configure(kind ?? "password", initialized ?? true),
  { immediate: true },
)

const preview = computed(() => props.job.preview)
const restriction = computed(() => preview.value?.transferRestriction ?? null)
const deadlineText = computed(() => formatInheritRemaining(t, props.job.confirmDeadline, now.value))
const restrictionEnd = computed(() => {
  const end = restriction.value?.restrictEndAt ?? 0
  return end > 0 ? formatLocalizedDateTime(end) : ""
})
const busy = computed(() => props.pending !== null)

async function submit() {
  if (busy.value || !unlock.validate()) return
  try {
    await props.onConfirm(unlock.toInput())
    unlock.reset()
  } catch (error) {
    unlock.absorb(toInheritApiError(error))
  }
}

async function cancel() {
  if (busy.value) return
  try {
    await props.onCancel()
  } catch (error) {
    unlock.absorb(toInheritApiError(error))
  }
}

function updateField(field: "secret" | "repeat" | "previousPassword", value: string) {
  unlock.state[field] = value
}
</script>

<template>
  <section class="space-y-4" aria-labelledby="inherit-confirm-title" data-testid="inherit-confirm">
    <div class="space-y-1">
      <h3 id="inherit-confirm-title" class="text-base font-semibold">{{ t("tools.uploadData.inheritJob.confirm.title") }}</h3>
      <p class="text-sm text-muted-foreground">{{ t("tools.uploadData.inheritJob.confirm.description") }}</p>
    </div>

    <dl v-if="preview" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <div class="min-w-0 rounded-lg border bg-muted/20 p-3">
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserRound class="size-3.5" />{{ t("tools.uploadData.inheritJob.confirm.nickname") }}
        </dt>
        <dd class="mt-1 truncate text-base font-semibold" data-testid="inherit-preview-nickname">{{ preview.nickname || "—" }}</dd>
      </div>
      <div class="min-w-0 rounded-lg border bg-muted/20 p-3">
        <dt class="text-xs text-muted-foreground">{{ t("tools.uploadData.inheritJob.confirm.rank") }}</dt>
        <dd class="mt-1 text-base font-semibold tabular-nums">{{ preview.rank }}</dd>
      </div>
      <div class="col-span-2 min-w-0 rounded-lg border bg-muted/20 p-3 sm:col-span-1">
        <dt class="text-xs text-muted-foreground">{{ t("tools.uploadData.inheritJob.confirm.userId") }}</dt>
        <dd class="mt-1 break-all font-mono text-sm font-semibold">{{ preview.gameUserIdMasked || "—" }}</dd>
      </div>
    </dl>

    <div class="rounded-lg border p-3 text-sm" data-testid="inherit-restriction">
      <p class="font-medium">{{ t("tools.uploadData.inheritJob.confirm.restriction.title") }}</p>
      <template v-if="restriction && (restriction.isRestrictDeviceTransfer || restriction.isWorldBloomChapter)">
        <ul class="mt-1.5 space-y-1 text-muted-foreground">
          <li v-if="restriction.isRestrictDeviceTransfer" class="font-medium text-amber-700 dark:text-amber-300">
            {{ t("tools.uploadData.inheritJob.confirm.restriction.active") }}
          </li>
          <li v-if="restriction.isRestrictDeviceTransfer">
            {{ t("tools.uploadData.inheritJob.confirm.restriction.remaining", { count: restriction.restTransferCount }) }}
          </li>
          <li v-if="restrictionEnd">{{ t("tools.uploadData.inheritJob.confirm.restriction.endsAt", { time: restrictionEnd }) }}</li>
          <li v-if="restriction.isWorldBloomChapter">{{ t("tools.uploadData.inheritJob.confirm.restriction.worldBloom") }}</li>
        </ul>
      </template>
      <p v-else class="mt-1 text-muted-foreground">{{ t("tools.uploadData.inheritJob.confirm.restriction.none") }}</p>
    </div>

    <Alert variant="destructive" class="border-destructive/50 bg-destructive/5">
      <Smartphone />
      <AlertTitle>{{ t("tools.uploadData.inheritJob.confirm.warningTitle") }}</AlertTitle>
      <AlertDescription>{{ t("tools.uploadData.inheritJob.confirm.warningBody") }}</AlertDescription>
    </Alert>

    <p v-if="deadlineText" class="flex items-center gap-2 text-xs text-muted-foreground">
      <Timer class="size-3.5 shrink-0" />
      {{ t("tools.uploadData.inheritJob.confirm.deadline", { time: deadlineText }) }}
    </p>

    <form class="space-y-4" novalidate @submit.prevent="submit">
      <InheritUnlockFields
        :state="unlock.state"
        id-prefix="inherit-confirm"
        :disabled="busy"
        :first-use="job.unlock?.initialized === false"
        @update="updateField"
        @submit="submit"
        @reset-vault="emit('reset-vault')"
      />
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" :disabled="busy" @click="cancel">
          <Loader2 v-if="pending === 'cancel'" class="size-4 animate-spin" />
          <X v-else class="size-4" />
          {{ pending === "cancel" ? t("tools.uploadData.inheritJob.confirm.cancelling") : t("tools.uploadData.inheritJob.confirm.cancel") }}
        </Button>
        <Button type="submit" variant="destructive" :disabled="busy">
          <Loader2 v-if="pending === 'confirm'" class="size-4 animate-spin" />
          <ShieldCheck v-else class="size-4" />
          {{ pending === "confirm" ? t("tools.uploadData.inheritJob.confirm.submitting") : t("tools.uploadData.inheritJob.confirm.submit") }}
        </Button>
      </div>
    </form>

  </section>
</template>
