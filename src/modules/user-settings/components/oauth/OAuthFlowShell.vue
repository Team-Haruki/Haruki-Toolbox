<script setup lang="ts">
/**
 * The frame of the OAuth2 flow pages (sign-in hand-off, consent, device
 * authorization, sign-out): one centred column holding the page heading and
 * a single panel, the same shape as the sign-in pages.
 *
 *   <OAuthFlowShell :title="…" :loading="…" :loading-label="…">
 *     <template #notice>…a panel of its own above the main one…</template>
 *     …the panel's content (default slot), sections split by hairlines…
 *   </OAuthFlowShell>
 *
 * While the request loads the panel shows that instead of the slot.
 * `data-oauth-page` marks the column for the layout checks.
 */
import { Loader2 } from "lucide-vue-next"
import PageHeader from "@/shared/components/PageHeader.vue"

withDefaults(defineProps<{
  title: string
  description?: string | null
  loading?: boolean
  /** What is being read, shown next to the spinner. */
  loadingLabel?: string
}>(), {
  description: null,
  loading: false,
  loadingLabel: "",
})
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="flex w-full max-w-md min-w-0 flex-col gap-4" data-oauth-page>
      <PageHeader :title="title" :description="description" class="px-1" />
      <slot name="notice" />
      <section class="@container min-w-0 overflow-hidden rounded-xl border bg-card">
        <p
          v-if="loading"
          class="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 class="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ loadingLabel }}
        </p>
        <div v-else class="divide-y divide-border/60">
          <slot />
        </div>
      </section>
    </div>
  </div>
</template>
