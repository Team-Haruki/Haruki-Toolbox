<script setup lang="ts">
/**
 * The reply box at the foot of a ticket's conversation. One line at rest so
 * it can stay pinned to the bottom of a phone screen, growing with the text
 * up to a third of a page. Enter sends on a keyboard; on a touch screen
 * Enter is a newline and only the button sends. The page owns the text and
 * the request; this is the field, the button and the line of state under it.
 */
import { nextTick, onMounted, useTemplateRef, watch } from "vue"
import { useMediaQuery } from "@vueuse/core"
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideLoader2, LucideSend } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { showsCharacterCount, TICKET_MESSAGE_MAX_LENGTH } from "@/modules/tickets/lib/ticket-draft"

const props = defineProps<{
  /** Characters in the trimmed text, counted the way the backend counts them. */
  length: number
  tooLong: boolean
  canSend: boolean
  sending: boolean
  /** Briefly true after a reply landed. */
  justSent: boolean
  /** A line above the field (replying to a resolved ticket reopens it). */
  note?: string | null
}>()

const emit = defineEmits<{ send: [] }>()

const text = defineModel<string>({ required: true })

const { t } = useI18n()

const FIELD_ID = "ticket-reply"
const ERROR_ID = "ticket-reply-error"

// Phone keyboards have no Shift+Enter: on a coarse pointer Enter stays a
// newline and only the send button sends, so the "Enter to send" hint goes too.
const coarsePointer = useMediaQuery("(pointer: coarse)")
const field = useTemplateRef<HTMLTextAreaElement>("field")

/** Fits the field to its text; the CSS max-height caps it and scrolls past that. */
function fitHeight() {
  const element = field.value
  if (!element) return
  element.style.height = "auto"
  element.style.height = `${element.scrollHeight + (element.offsetHeight - element.clientHeight)}px`
}

watch(text, () => {
  void nextTick(fitHeight)
})
onMounted(fitHeight)

function handleEnter(event: KeyboardEvent) {
  if (coarsePointer.value) return
  // Ignore the Enter that confirms an IME composition (e.g. picking a pinyin
  // candidate); otherwise an unfinished message would be sent prematurely.
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  if (props.canSend) emit("send")
}
</script>

<template>
  <form class="flex flex-col gap-1.5" data-slot="ticket-reply" @submit.prevent="canSend && emit('send')">
    <p v-if="note" class="text-xs text-muted-foreground">{{ note }}</p>
    <div class="flex items-end gap-2">
      <Label :for="FIELD_ID" class="sr-only">{{ t("tickets.detail.replyLabel") }}</Label>
      <textarea
        :id="FIELD_ID"
        ref="field"
        v-model="text"
        rows="1"
        :placeholder="t('tickets.detail.inputPlaceholder')"
        :aria-invalid="tooLong || undefined"
        :aria-describedby="tooLong ? ERROR_ID : undefined"
        class="max-h-48 min-h-9 min-w-0 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-1.5 text-base leading-snug shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 pointer-coarse:min-h-10 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
        @keydown.enter.exact="handleEnter"
      />
      <Button type="submit" class="shrink-0" :disabled="!canSend">
        <LucideLoader2 v-if="sending" class="animate-spin" aria-hidden="true" />
        <LucideSend v-else aria-hidden="true" />
        {{ t("tickets.detail.sendButton") }}
      </Button>
    </div>
    <div
      v-if="tooLong || justSent || !coarsePointer || showsCharacterCount(length, TICKET_MESSAGE_MAX_LENGTH)"
      class="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
    >
      <p v-if="tooLong" :id="ERROR_ID" role="alert" class="text-destructive">
        {{ t("tickets.detail.replyTooLong", { max: TICKET_MESSAGE_MAX_LENGTH }) }}
      </p>
      <span v-else-if="!coarsePointer">{{ t("tickets.detail.composeHint") }}</span>
      <span v-else aria-hidden="true" />
      <span
        v-if="justSent"
        class="inline-flex items-center gap-1 text-primary"
        role="status"
        aria-live="polite"
      >
        <LucideCheck class="size-3.5" aria-hidden="true" />
        {{ t("tickets.detail.sentState") }}
      </span>
      <span
        v-else-if="showsCharacterCount(length, TICKET_MESSAGE_MAX_LENGTH)"
        :class="['tabular-nums', tooLong ? 'text-destructive' : '']"
      >
        {{ t("tickets.create.count", { count: length, max: TICKET_MESSAGE_MAX_LENGTH }) }}
      </span>
    </div>
  </form>
</template>
