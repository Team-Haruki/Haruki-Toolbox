<script setup lang="ts">
import { CheckCircle2, ShieldCheck } from "lucide-vue-next"

defineProps<{
  verified: boolean
  verifiedLabel: string
  unverifiedLabel: string
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
      verified
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    ]"
  >
    <CheckCircle2 v-if="verified" class="h-3.5 w-3.5" />
    <ShieldCheck v-else class="h-3.5 w-3.5" />
    {{ verified ? verifiedLabel : unverifiedLabel }}
  </span>
</template>
