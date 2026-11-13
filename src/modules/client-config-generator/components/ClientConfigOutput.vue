<script setup lang="ts">
/**
 * The generated file: what it holds at a glance, what is still missing, the
 * copy and download actions, and the text itself in a box that scrolls on
 * its own (long credentials never widen the page).
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Copy, Download, TriangleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useClientConfigForm } from "@/modules/client-config-generator/composables/useClientConfigForm"

const { t } = useI18n()
const { generated, counts, missingEssentials, copyYaml, downloadYaml } = useClientConfigForm()

const facts = computed(() => [
  {
    key: "modules",
    label: t("tools.clientConfigGenerator.summary.modules"),
    value: generated.value.parsed.enableModules.includes("all")
      ? t("tools.clientConfigGenerator.summary.allModules")
      : String(counts.value.modules),
  },
  { key: "admins", label: t("tools.clientConfigGenerator.summary.admins"), value: String(counts.value.admins) },
  { key: "scopes", label: t("tools.clientConfigGenerator.summary.scopes"), value: String(counts.value.scopes) },
])

const missingNote = computed(() => {
  const missing = missingEssentials.value
  if (missing.length === 0) return ""
  if (missing.length > 1) return t("tools.clientConfigGenerator.output.missing.both")
  return t(`tools.clientConfigGenerator.output.missing.${missing[0]}`)
})
</script>

<template>
  <section
    class="overflow-hidden rounded-xl border bg-card"
    aria-labelledby="client-config-output-title"
    data-testid="client-config-output"
  >
    <div class="grid gap-3 p-4">
      <h2 id="client-config-output-title" class="text-sm font-semibold">{{ t("tools.clientConfigGenerator.output.title") }}</h2>

      <dl class="flex flex-wrap gap-x-6 gap-y-2">
        <div v-for="fact in facts" :key="fact.key" class="flex flex-col" :data-fact="fact.key">
          <dt class="text-[11px] text-muted-foreground">{{ fact.label }}</dt>
          <dd class="text-sm font-semibold tabular-nums">{{ fact.value }}</dd>
        </div>
      </dl>

      <p
        v-if="missingNote"
        class="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
        role="status"
        data-testid="client-config-missing"
      >
        <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
        {{ missingNote }}
      </p>

      <div class="flex flex-wrap gap-2">
        <Button type="button" class="flex-1" data-testid="client-config-copy" @click="copyYaml">
          <Copy class="size-4" aria-hidden="true" />
          {{ t("tools.clientConfigGenerator.actions.copy") }}
        </Button>
        <Button type="button" variant="outline" class="flex-1" data-testid="client-config-download" @click="downloadYaml">
          <Download class="size-4" aria-hidden="true" />
          {{ t("tools.clientConfigGenerator.actions.download") }}
        </Button>
      </div>
    </div>

    <pre
      class="max-h-[28rem] overflow-auto border-t border-border/60 bg-muted/30 px-4 py-3 font-mono text-xs leading-relaxed @min-[60rem]:max-h-[calc(100dvh-21rem)] @min-[60rem]:min-h-40"
      tabindex="0"
      role="region"
      :aria-label="t('tools.clientConfigGenerator.output.codeLabel')"
      data-testid="client-config-yaml"
    ><code>{{ generated.yaml }}</code></pre>
  </section>
</template>
