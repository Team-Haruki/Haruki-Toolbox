<script setup lang="ts">
import { CheckCircle2, CircleAlert, CircleX, Info } from "lucide-vue-next"
import type {
  KratosFlowMessage,
  KratosFlowMessageTone,
} from "@/modules/auth/composables/useKratosBrowserFlow"

defineProps<{
  messages: KratosFlowMessage[]
}>()

function messageClass(tone: KratosFlowMessageTone): string {
  if (tone === "error") {
    return "flex items-start gap-2 rounded-md border border-destructive/30 border-l-4 border-l-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
  }

  if (tone === "success") {
    return "flex items-start gap-2 rounded-md border border-green-300 border-l-4 border-l-green-500 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:border-l-green-400 dark:bg-green-900/20 dark:text-green-300"
  }

  if (tone === "warning") {
    return "flex items-start gap-2 rounded-md border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/40 dark:border-l-amber-400 dark:bg-amber-900/20 dark:text-amber-300"
  }

  return "flex items-start gap-2 rounded-md border border-blue-300 border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:border-l-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
}

function iconForTone(tone: KratosFlowMessageTone) {
  if (tone === "error") {
    return CircleX
  }

  if (tone === "success") {
    return CheckCircle2
  }

  if (tone === "warning") {
    return CircleAlert
  }

  return Info
}
</script>

<template>
  <div v-if="messages.length > 0" class="space-y-2">
    <p
      v-for="message in messages"
      :key="message.key"
      :class="messageClass(message.tone)"
    >
      <component :is="iconForTone(message.tone)" class="mt-0.5 h-4 w-4 shrink-0" />
      <span class="break-words">{{ message.text }}</span>
    </p>
  </div>
</template>
