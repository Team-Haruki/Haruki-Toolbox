<script setup lang="ts">
/**
 * The frame of the sign-in family (sign in, sign up, password recovery, email
 * verification and the Kratos error page): one centred column holding the
 * page heading, a single panel, and a quiet footer for the cross-links. The
 * heading is the title alone: the form under it says the rest.
 *
 *   <AuthPageShell :title="…" :loading="…" :load-error="…" @restart="…">
 *     …the panel's content (default slot)…
 *     <template #footer>…links…</template>
 *   </AuthPageShell>
 *
 * While the flow loads, or when it could not be loaded, the panel shows that
 * instead of the slot (a failure is one sentence and its button). `data-kratos-page` marks the column: the e2e specs
 * read every text inside it and check that nothing reaches past its edge.
 */
import { useI18n } from "vue-i18n"
import { Loader2 } from "lucide-vue-next"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"

withDefaults(defineProps<{
  title: string
  /** One short line under the title; omitted where the title is the whole message (a second factor, an error). */
  description?: string
  loading?: boolean
  /** Why the flow could not be loaded, in the user's language; "" when it loaded. */
  loadError?: string
  /** Label of the button under a load error; "Start again" by default. */
  retryLabel?: string | null
}>(), {
  description: undefined,
  loading: false,
  loadError: "",
  retryLabel: null,
})

const emit = defineEmits<{ restart: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-0 py-4 sm:justify-center">
    <!-- Centred on a screen with room for it; on a phone the column starts at the top. -->
    <div class="flex w-full max-w-md min-w-0 flex-col gap-4" data-kratos-page>
      <PageHeader :title="title" :description="description" class="px-1" />
      <section class="min-w-0 overflow-hidden rounded-xl border bg-card">
        <p
          v-if="loading"
          class="flex items-center justify-center gap-2 px-4 py-12 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ t("auth.common.loadingFlow") }}
        </p>
        <div v-else-if="loadError" class="px-4">
          <LoadErrorState
            :title="loadError"
            description=""
            :retry-label="retryLabel ?? t('auth.common.restartFlow')"
            @retry="emit('restart')"
          />
        </div>
        <slot v-else />
      </section>
      <footer
        v-if="$slots.footer"
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-sm text-muted-foreground pointer-coarse:[&_a]:inline-flex pointer-coarse:[&_a]:min-h-10 pointer-coarse:[&_a]:min-w-10 pointer-coarse:[&_a]:items-center pointer-coarse:[&_a]:justify-center"
      >
        <!-- The links are short words: on touch each one is at least a 40 px target. -->
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
