<script setup lang="ts">
/**
 * "Who is asking": the app's name as the largest text of the panel, an
 * optional tag after it and optional notes under it (default slot). A child
 * of the panel's `<dl>`. The name is the app's own claim and wraps anywhere:
 * it is never cut short and never widens the panel.
 */
import { useI18n } from "vue-i18n"

defineProps<{
  name: string
}>()

const { t } = useI18n()
</script>

<template>
  <div class="min-w-0 px-4 py-3" data-slot="oauth-app-row">
    <dt class="text-[11px] text-muted-foreground">{{ t("oauth.common.app") }}</dt>
    <dd class="mt-0.5 min-w-0">
      <p class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span class="min-w-0 text-base leading-snug font-semibold [overflow-wrap:anywhere]" data-slot="oauth-app-name">{{ name }}</span>
        <slot name="tag" />
      </p>
      <div v-if="$slots.default" class="mt-1 grid min-w-0 gap-1 text-xs text-muted-foreground">
        <slot />
      </div>
    </dd>
  </div>
</template>
