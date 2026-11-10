<script setup lang="ts">
/**
 * A `SettingsGroup` line that goes somewhere: icon, label with help text and
 * a chevron, the whole line one control. The default slot sits before the
 * chevron (a status badge, a count).
 *
 *   <SettingsLinkRow :icon="KeyRound" :label="…" :help="…" @click="open" />
 *
 * With `href` it is a link that opens in a new tab and shows the external
 * mark instead of the chevron.
 */
import type { Component } from "vue"
import { LucideChevronRight, LucideExternalLink } from "lucide-vue-next"

defineProps<{
  icon?: Component
  label: string
  help?: string
  href?: string
}>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :type="href ? undefined : 'button'"
    :href="href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    class="group flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    data-slot="settings-link-row"
  >
    <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
      <component :is="icon" v-if="icon" class="size-4" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-medium">{{ label }}</span>
      <span v-if="help" class="mt-0.5 block text-xs text-muted-foreground">{{ help }}</span>
    </span>
    <slot />
    <LucideExternalLink v-if="href" class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <LucideChevronRight v-else class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
  </component>
</template>
