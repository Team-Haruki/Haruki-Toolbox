<script setup lang="ts">
/**
 * "What it asks for": a heading over one hairline-separated row per scope
 * (its name, one short line only where the name does not say it all, and an
 * amber tag on the rows that deserve a second look), then the write warning
 * when the request can change or submit data. Nothing else is coloured.
 */
import { useI18n } from "vue-i18n"
import { getScopeDescription, getScopeLabel } from "@/modules/user-settings/lib/oauth-scopes"
import type { OAuthScopeRow } from "@/modules/user-settings/lib/oauth-scope-rows"
import OAuthAttentionNote from "@/modules/user-settings/components/oauth/OAuthAttentionNote.vue"
import OAuthTag from "@/modules/user-settings/components/oauth/OAuthTag.vue"

defineProps<{
  rows: readonly OAuthScopeRow[]
  /** The request includes write access: show the warning under the list. */
  warnWrite: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <section class="min-w-0" data-slot="oauth-scope-list">
    <h2 class="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">{{ t("oauth.common.scopesTitle") }}</h2>
    <ul v-if="rows.length > 0" class="divide-y divide-border/60">
      <li
        v-for="row in rows"
        :key="row.key"
        class="flex min-w-0 items-start gap-3 px-4 py-2.5"
        :data-scope="row.scope"
        :data-risk="row.risk"
        :data-attention="row.attention ?? undefined"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium [overflow-wrap:anywhere]">{{ getScopeLabel(row.scope) }}</p>
          <p v-if="getScopeDescription(row.scope)" class="mt-0.5 text-xs text-muted-foreground">
            {{ getScopeDescription(row.scope) }}
          </p>
        </div>
        <OAuthTag v-if="row.attention" tone="attention" class="mt-0.5">{{ t(`oauth.scopeTag.${row.attention}`) }}</OAuthTag>
        <OAuthTag v-else-if="!row.known" tone="neutral" class="mt-0.5">{{ t("oauth.scopeTag.unknown") }}</OAuthTag>
      </li>
    </ul>
    <p v-else class="px-4 pt-1 pb-3 text-sm">{{ t("oauth.common.noScopes") }}</p>
    <div v-if="warnWrite" class="border-t border-border/60 px-4 py-3">
      <OAuthAttentionNote>{{ t("oauth.common.writeWarning") }}</OAuthAttentionNote>
    </div>
  </section>
</template>
