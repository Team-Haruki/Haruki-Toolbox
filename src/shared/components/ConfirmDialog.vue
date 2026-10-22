<script setup lang="ts">
/**
 * Confirmation dialog that runs the confirmed action itself.
 *
 * `onConfirm` (also reachable as `@confirm`, since Vue maps the listener onto
 * the declared `onConfirm` prop) runs when the admin confirms. While it is
 * pending the confirm button shows a spinner and the dialog cannot be closed
 * (Escape, outside click and the cancel button are all blocked). When it
 * resolves the dialog closes and emits `success`; when it rejects the dialog
 * stays open and shows the error inline (`describeError`, by default
 * `extractErrorMessage`), so a 403 or a dropped connection does not throw the
 * admin back to the page with only a toast. A rejection that is not worth
 * reporting (`shouldReportError`, e.g. a cancelled admin password prompt)
 * just ends the pending state. Without `onConfirm` the dialog simply closes.
 *
 * `nonDismissable` is for "shown only once" reveals (client secrets, webhook
 * tokens): no cancel button, Escape and outside clicks do nothing, and the
 * confirm button ("I have saved it") is the only way out.
 */
import { ref, useSlots, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2 } from "lucide-vue-next"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { extractErrorMessage, shouldReportError } from "@/lib/error-utils"

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** Plain-text description; use the `description` slot for rich content. */
    description?: string
    /** Defaults to the shared "Confirm" label. */
    confirmLabel?: string
    /** Defaults to the shared "Cancel" label. */
    cancelLabel?: string
    /** Styles the confirm button as destructive. */
    destructive?: boolean
    /** No cancel, no Escape, no outside click: only the confirm button closes it. */
    nonDismissable?: boolean
    /** The confirmed action; a rejection keeps the dialog open with its message. */
    onConfirm?: () => unknown
    /** Turns a rejection into the inline error text; defaults to `extractErrorMessage`. */
    describeError?: (error: unknown) => string
  }>(),
  {
    description: "",
    confirmLabel: "",
    cancelLabel: "",
    destructive: false,
    nonDismissable: false,
    onConfirm: undefined,
    describeError: undefined,
  }
)

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  /** The action resolved; the dialog is closing. */
  (event: "success", result: unknown): void
  /** The action rejected with a reportable error; the dialog stays open. */
  (event: "error", error: unknown): void
}>()

const { t } = useI18n()
const slots = useSlots()
const loading = ref(false)
const errorMessage = ref("")
// Bumped whenever the dialog opens or closes so a run that outlives its dialog
// (closed by the parent mid-flight) cannot touch the next one's state.
let runId = 0

watch(
  () => props.open,
  () => {
    runId += 1
    loading.value = false
    errorMessage.value = ""
  }
)

function handleOpenChange(value: boolean) {
  if (value) return
  if (loading.value || props.nonDismissable) return
  emit("update:open", false)
}

function handleEscapeKeyDown(event: Event) {
  if (loading.value || props.nonDismissable) {
    event.preventDefault()
  }
}

async function handleConfirm() {
  if (loading.value) return
  if (!props.onConfirm) {
    emit("success", undefined)
    emit("update:open", false)
    return
  }

  const run = ++runId
  loading.value = true
  errorMessage.value = ""
  try {
    const result = await props.onConfirm()
    if (run !== runId) return
    loading.value = false
    emit("success", result)
    emit("update:open", false)
  } catch (error: unknown) {
    if (run !== runId) return
    loading.value = false
    if (!shouldReportError(error)) return
    errorMessage.value = props.describeError ? props.describeError(error) : extractErrorMessage(error)
    emit("error", error)
  }
}
</script>

<template>
  <AlertDialog :open="open" @update:open="handleOpenChange">
    <AlertDialogContent @escape-key-down="handleEscapeKeyDown">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description || slots.description">
          <slot name="description">{{ description }}</slot>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <slot />
      <p v-if="errorMessage" role="alert" class="text-sm text-destructive">
        {{ errorMessage }}
      </p>
      <AlertDialogFooter>
        <AlertDialogCancel v-if="!nonDismissable" :disabled="loading">
          {{ cancelLabel || t("common.cancel") }}
        </AlertDialogCancel>
        <Button
          type="button"
          :variant="destructive ? 'destructive' : 'default'"
          :disabled="loading"
          :aria-busy="loading || undefined"
          @click="handleConfirm"
        >
          <LucideLoader2 v-if="loading" class="animate-spin" />
          {{ confirmLabel || t("common.confirm") }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
