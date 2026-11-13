<script setup lang="ts">
import { CheckCircle2, CircleAlert, CircleX, Info } from "lucide-vue-next"
import type {
  KratosFlowMessage,
  KratosFlowMessageTone,
} from "@/modules/auth/composables/useKratosBrowserFlow"

// Kratos messages as plain lines: the panel they sit in is the only box.
// `notice` is a flow-level line with a tone icon; `field` is the small line
// under an input or a button.
withDefaults(defineProps<{
  messages: KratosFlowMessage[]
  variant?: "notice" | "field"
  /** Id of the list, for `aria-describedby` on the control it explains. */
  id?: string
}>(), {
  variant: "notice",
  id: undefined,
})

// Errors and warnings colour the whole line; an info or success line keeps
// the body colour and lets the icon carry the tone.
const TEXT_TONE: Record<KratosFlowMessageTone, string> = {
  error: "text-destructive",
  warning: "text-amber-800 dark:text-amber-300",
  success: "text-foreground",
  info: "text-foreground",
}

const ICON_TONE: Record<KratosFlowMessageTone, string> = {
  error: "",
  warning: "",
  success: "text-primary",
  info: "text-muted-foreground",
}

const FIELD_TONE: Record<KratosFlowMessageTone, string> = {
  error: "text-destructive",
  warning: "text-amber-800 dark:text-amber-300",
  success: "text-muted-foreground",
  info: "text-muted-foreground",
}

// A message can carry one long unbreakable token (a spec URL in a WebAuthn
// error, a request id). `break-words` alone does not shrink a flex item's
// minimum width, so such a message pushed the whole form wider than its panel
// and off the side of a phone. `[overflow-wrap:anywhere]` lets the token break
// and count as breakable for sizing; `min-w-0` keeps the block from growing
// with its content inside the form's grid.
const ICONS = {
  error: CircleX,
  warning: CircleAlert,
  success: CheckCircle2,
  info: Info,
} as const
</script>

<template>
  <div v-if="messages.length > 0" :id="id" :class="['grid min-w-0', variant === 'field' ? 'gap-1' : 'gap-2']">
    <template v-if="variant === 'field'">
      <p
        v-for="message in messages"
        :key="message.key"
        :class="['min-w-0 text-xs [overflow-wrap:anywhere]', FIELD_TONE[message.tone]]"
        :role="message.tone === 'error' ? 'alert' : undefined"
      >
        {{ message.text }}
      </p>
    </template>
    <template v-else>
      <p
        v-for="message in messages"
        :key="message.key"
        :class="['flex min-w-0 items-start gap-2 text-sm', TEXT_TONE[message.tone]]"
        :role="message.tone === 'error' ? 'alert' : 'status'"
        :data-tone="message.tone"
      >
        <component :is="ICONS[message.tone]" :class="['mt-0.5 size-4 shrink-0', ICON_TONE[message.tone]]" aria-hidden="true" />
        <span class="min-w-0 [overflow-wrap:anywhere]">{{ message.text }}</span>
      </p>
    </template>
  </div>
</template>
