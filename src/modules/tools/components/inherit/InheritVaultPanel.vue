<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  LucideAlertTriangle,
  RefreshCw,
  RotateCcw,
  Vault,
} from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import FieldError from "@/shared/components/FieldError.vue"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { useNowTick } from "@/composables/useNowTick"
import { toInheritApiError } from "@/modules/tools/api/inherit"
import type { InheritNewPasswordMode } from "@/modules/tools/lib/inherit-job"
import { isVaultCodeLive, type InheritVaultEntry } from "@/modules/tools/lib/inherit-vault"
import { describeInheritApiError, describeJobWarning, formatInheritRemaining } from "@/modules/tools/lib/inherit-messages"
import { useInheritUnlock } from "@/modules/tools/composables/useInheritUnlock"
import type { InheritVaultController } from "@/modules/tools/composables/useInheritVault"
import InheritNewCodeCard from "@/modules/tools/components/inherit/InheritNewCodeCard.vue"
import InheritUnlockFields from "@/modules/tools/components/inherit/InheritUnlockFields.vue"

/**
 * The owner's vault: one row per transferred account with its countdowns,
 * and the step-up actions (reveal, re-issue), destroy ("I recovered it on my
 * phone") and the vault reset.
 */
const props = defineProps<{
  vault: InheritVaultController
}>()

const { t } = useI18n()
const now = useNowTick(1000)
const unlock = useInheritUnlock()

const keyStatus = computed(() => props.vault.keyStatus.value)
const entries = computed(() => props.vault.entries.value)
const revealed = computed(() => props.vault.revealed.value)
const loading = computed(() => props.vault.loading.value)
const loadError = computed(() => props.vault.loadError.value)

type UnlockAction = "reveal" | "reissue"
const action = reactive<{ open: boolean; kind: UnlockAction; entryId: string; mode: InheritNewPasswordMode }>({
  open: false,
  kind: "reveal",
  entryId: "",
  mode: "random",
})
const destroyTarget = ref<InheritVaultEntry | null>(null)
const destroyOpen = ref(false)
const reset = reactive({ open: false, password: "", ack: false, needsPassword: false, passwordError: "", ackError: "" })

function remaining(target: string | null): string | null {
  return formatInheritRemaining(t, target, now.value)
}

function entryTitle(entry: InheritVaultEntry): string {
  return t("tools.uploadData.inheritVault.entry.title", {
    server: t(`tools.uploadData.region.${entry.server}`),
    uid: entry.gameUserIdMasked || "—",
  })
}

function credentialLive(entry: InheritVaultEntry): boolean {
  if (!entry.credentialExpiresAt) return true
  const expires = Date.parse(entry.credentialExpiresAt)
  return Number.isNaN(expires) || expires > now.value
}

function openUnlock(kind: UnlockAction, entry: InheritVaultEntry) {
  unlock.reset()
  unlock.configure(keyStatus.value?.kind ?? "password", true)
  action.kind = kind
  action.entryId = entry.id
  action.mode = "random"
  action.open = true
}

async function runUnlock() {
  if (!unlock.validate()) throw new Error("")
  try {
    if (action.kind === "reveal") {
      await props.vault.reveal(action.entryId, unlock.toInput())
    } else {
      await props.vault.reissue(action.entryId, unlock.toInput(), action.mode)
      toast.success(t("tools.uploadData.inheritVault.toast.reissued"))
    }
    unlock.reset()
  } catch (error) {
    const problem = toInheritApiError(error)
    unlock.absorb(problem)
    throw problem
  }
}

function openDestroy(entry: InheritVaultEntry) {
  destroyTarget.value = entry
  destroyOpen.value = true
}

async function runDestroy() {
  const target = destroyTarget.value
  if (!target) return
  await props.vault.destroy(target.id)
  toast.success(t("tools.uploadData.inheritVault.toast.destroyed"))
}

/** Opens the reset dialog (also reached from a "forgot my old password" detour). */
function openReset() {
  action.open = false
  reset.password = ""
  reset.ack = false
  reset.passwordError = ""
  reset.ackError = ""
  reset.needsPassword = keyStatus.value?.kind !== "pin"
  reset.open = true
}

async function runReset() {
  reset.passwordError = ""
  reset.ackError = ""
  if (!reset.ack) {
    reset.ackError = t("tools.uploadData.inheritErrors.reset_confirmation_required")
    throw new Error("")
  }
  if (reset.needsPassword && !reset.password) {
    reset.passwordError = t("tools.uploadData.inheritErrors.password_required")
    throw new Error("")
  }
  try {
    const destroyed = await props.vault.reset(reset.needsPassword ? reset.password : undefined)
    toast.success(t("tools.uploadData.inheritVault.reset.done", { count: destroyed }))
  } catch (error) {
    const problem = toInheritApiError(error)
    // An identity with a password always has to confirm with it, even when
    // its vault was made with a PIN before the password was added.
    if (problem.code === "password_required" || problem.code === "password_invalid") {
      reset.needsPassword = true
      reset.passwordError = describeInheritApiError(t, problem)
      throw new Error("", { cause: error })
    }
    throw problem
  }
}

function describeDialogError(error: unknown): string {
  // Field-level problems are already shown next to their field.
  if (error instanceof Error && error.message === "") return ""
  const problem = toInheritApiError(error)
  return unlock.state.formError || unlock.state.secretError || unlock.state.previousError
    ? ""
    : describeInheritApiError(t, problem)
}

function describeResetError(error: unknown): string {
  if (error instanceof Error && error.message === "") return ""
  return describeInheritApiError(t, toInheritApiError(error))
}

function updateUnlockField(field: "secret" | "repeat" | "previousPassword", value: string) {
  unlock.state[field] = value
}

const unlockTitle = computed(() => action.kind === "reveal"
  ? t("tools.uploadData.inheritVault.reveal.title")
  : t("tools.uploadData.inheritVault.reissue.title"))
const unlockDescription = computed(() => action.kind === "reveal"
  ? t("tools.uploadData.inheritVault.reveal.description")
  : t("tools.uploadData.inheritVault.reissue.description"))

defineExpose({ openReset })
</script>

<template>
  <Card id="inherit-vault" data-testid="inherit-vault" class="scroll-mt-20">
    <CardHeader class="gap-2">
      <div class="flex items-center justify-between gap-2">
        <CardTitle class="flex items-center gap-2">
          <Vault class="size-5" />
          {{ t("tools.uploadData.inheritVault.title") }}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          :disabled="loading"
          :aria-label="t('tools.uploadData.inheritVault.refresh')"
          @click="vault.refresh()"
        >
          <RefreshCw :class="['size-4', loading ? 'animate-spin' : '']" />
        </Button>
      </div>
      <CardDescription class="leading-relaxed">{{ t("tools.uploadData.inheritVault.description") }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-3">
      <Alert v-if="loadError" variant="destructive">
        <LucideAlertTriangle />
        <AlertTitle>{{ t("tools.uploadData.inheritVault.loadFailed") }}</AlertTitle>
        <AlertDescription>{{ describeInheritApiError(t, loadError) }}</AlertDescription>
      </Alert>

      <p v-if="!loadError && keyStatus && !keyStatus.initialized && entries.length === 0" class="text-sm text-muted-foreground">
        {{ t("tools.uploadData.inheritVault.notInitialized") }}
      </p>
      <p v-else-if="!loadError && !loading && entries.length === 0" class="text-sm text-muted-foreground">
        {{ t("tools.uploadData.inheritVault.empty") }}
      </p>

      <ul class="space-y-3">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="space-y-3 rounded-lg border p-3"
          data-testid="inherit-vault-entry"
          :data-entry-id="entry.id"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-mono text-sm font-semibold">{{ entryTitle(entry) }}</p>
              <p class="text-xs text-muted-foreground">
                {{ t("tools.uploadData.inheritVault.entry.createdAt", { time: formatLocalizedDateTime(entry.createdAt) }) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge v-if="entry.pending" variant="amber" size="sm">{{ t("tools.uploadData.inheritVault.entry.pending") }}</Badge>
            </div>
          </div>

          <p v-if="!entry.readable" class="text-sm text-destructive">{{ t("tools.uploadData.inheritVault.entry.unreadable") }}</p>

          <dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div class="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5">
              <dt class="flex items-center gap-1.5 text-muted-foreground"><Clock class="size-3.5" />{{ t("tools.uploadData.inheritVault.entry.credential") }}</dt>
              <dd class="tabular-nums">
                {{ remaining(entry.credentialExpiresAt) ? t("tools.uploadData.inheritVault.entry.expiresIn", { time: remaining(entry.credentialExpiresAt) }) : t("tools.uploadData.inheritVault.entry.expired") }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-1.5">
              <dt class="flex items-center gap-1.5 text-muted-foreground"><KeyRound class="size-3.5" />{{ t("tools.uploadData.inheritVault.entry.code") }}</dt>
              <dd class="tabular-nums" data-testid="inherit-vault-code-state">
                {{ isVaultCodeLive(entry, now) && remaining(entry.codeExpiresAt)
                  ? t("tools.uploadData.inheritVault.entry.expiresIn", { time: remaining(entry.codeExpiresAt) })
                  : t("tools.uploadData.inheritVault.entry.noCode") }}
              </dd>
            </div>
          </dl>

          <div v-if="revealed[entry.id]" class="space-y-2">
            <InheritNewCodeCard
              :inherit-id="revealed[entry.id].inheritId"
              :password="revealed[entry.id].password"
              :expires-at="revealed[entry.id].expiresAt"
              :unsaved="revealed[entry.id].warnings.some((warning) => warning.code === 'vault_store_failed')"
              :saved-to-vault="revealed[entry.id].source === 'reissue' && !revealed[entry.id].warnings.length"
              :title="revealed[entry.id].source === 'reissue' ? t('tools.uploadData.inheritVault.toast.reissued') : t('tools.uploadData.inheritVault.entry.currentCode')"
              :id-prefix="`inherit-vault-code-${entry.id}`"
            />
            <p
              v-for="warning in revealed[entry.id].warnings.filter((item) => item.code !== 'vault_store_failed')"
              :key="warning.code"
              class="text-xs text-muted-foreground"
            >
              {{ describeJobWarning(t, warning) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              v-if="revealed[entry.id]"
              type="button"
              size="sm"
              variant="outline"
              @click="vault.hide(entry.id)"
            >
              <EyeOff class="size-4" />{{ t("tools.uploadData.inheritVault.actions.hide") }}
            </Button>
            <Button
              v-else
              type="button"
              size="sm"
              variant="outline"
              :disabled="!entry.readable || !isVaultCodeLive(entry, now)"
              @click="openUnlock('reveal', entry)"
            >
              <Eye class="size-4" />{{ t("tools.uploadData.inheritVault.actions.reveal") }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :disabled="!entry.readable || !credentialLive(entry)"
              @click="openUnlock('reissue', entry)"
            >
              <RotateCcw class="size-4" />{{ t("tools.uploadData.inheritVault.actions.reissue") }}
            </Button>
            <Button type="button" size="sm" variant="secondary" @click="openDestroy(entry)">
              <CircleCheck class="size-4" />{{ t("tools.uploadData.inheritVault.actions.destroy") }}
            </Button>
          </div>
        </li>
      </ul>
    </CardContent>

    <CardFooter v-if="keyStatus?.initialized" class="justify-end">
      <Button type="button" variant="ghost" size="sm" class="text-destructive hover:text-destructive" @click="openReset">
        {{ t("tools.uploadData.inheritVault.actions.reset") }}
      </Button>
    </CardFooter>
  </Card>

  <ConfirmDialog
    v-model:open="action.open"
    :title="unlockTitle"
    :description="unlockDescription"
    :confirm-label="action.kind === 'reveal' ? t('tools.uploadData.inheritVault.unlock.submit') : t('tools.uploadData.inheritVault.actions.reissue')"
    :on-confirm="runUnlock"
    :describe-error="describeDialogError"
  >
    <div class="space-y-4">
      <fieldset v-if="action.kind === 'reissue'" class="space-y-2">
        <legend class="text-sm font-medium">{{ t("tools.uploadData.inheritVault.reissue.modeLabel") }}</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label
            v-for="mode in (['random', 'reuse'] as const)"
            :key="mode"
            :class="['flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm', action.mode === mode ? 'border-primary bg-primary/5' : '']"
          >
            <input v-model="action.mode" type="radio" name="inherit-reissue-mode" :value="mode" class="accent-primary">
            {{ t(`tools.uploadData.inheritVault.reissue.${mode}`) }}
          </label>
        </div>
      </fieldset>
      <InheritUnlockFields
        :state="unlock.state"
        id-prefix="inherit-vault-unlock"
        @update="updateUnlockField"
        @reset-vault="openReset"
      />
    </div>
  </ConfirmDialog>

  <ConfirmDialog
    v-model:open="destroyOpen"
    :title="t('tools.uploadData.inheritVault.destroy.title')"
    :description="t('tools.uploadData.inheritVault.destroy.description')"
    :confirm-label="t('tools.uploadData.inheritVault.destroy.confirm')"
    destructive
    :on-confirm="runDestroy"
    :describe-error="describeResetError"
  />

  <ConfirmDialog
    v-model:open="reset.open"
    :title="t('tools.uploadData.inheritVault.reset.title')"
    :description="t('tools.uploadData.inheritVault.reset.description', { count: entries.length })"
    :confirm-label="t('tools.uploadData.inheritVault.reset.confirm')"
    destructive
    :on-confirm="runReset"
    :describe-error="describeResetError"
  >
    <div class="space-y-3">
      <div v-if="reset.needsPassword" class="space-y-1.5">
        <Label for="inherit-vault-reset-password">{{ t("tools.uploadData.inheritVault.reset.password") }}</Label>
        <Input
          id="inherit-vault-reset-password"
          v-model="reset.password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="reset.passwordError ? 'true' : undefined"
          aria-describedby="inherit-vault-reset-password-error"
        />
        <FieldError id="inherit-vault-reset-password-error" :message="reset.passwordError" />
      </div>
      <label for="inherit-vault-reset-ack" class="flex cursor-pointer items-start gap-2 text-sm">
        <Checkbox id="inherit-vault-reset-ack" v-model="reset.ack" class="mt-0.5" />
        <span>{{ t("tools.uploadData.inheritVault.reset.ack") }}</span>
      </label>
      <FieldError :message="reset.ackError" />
    </div>
  </ConfirmDialog>
</template>
