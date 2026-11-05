<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideCopy, LucidePackage } from "lucide-vue-next"
import CatalogInfoRow from "./CatalogInfoRow.vue"

/**
 * The "internal name" row of an info list: the raw asset-bundle id behind a
 * copy affordance. It is for people who look things up in the game files, so
 * it stays last and dimmed; one tap copies it (a check mark confirms) instead
 * of asking them to select a monospace string on a phone.
 */
const props = defineProps<{
  name: string | null | undefined
}>()

const { t } = useI18n()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  if (!props.name) {
    return
  }
  try {
    await navigator.clipboard.writeText(props.name)
  } catch {
    // Clipboard blocked (insecure context, permissions): the text stays
    // selectable, nothing else to do.
    return
  }
  copied.value = true
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <CatalogInfoRow :label="t('catalog.detail.assetName')" :icon="LucidePackage" muted>
    <button
      v-if="name"
      type="button"
      class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border border-dashed px-1.5 text-left font-mono break-all transition-colors hover:bg-muted hover:text-foreground pointer-coarse:min-h-10"
      :aria-label="`${t('catalog.detail.copyAssetName')}: ${name}`"
      :title="t('catalog.detail.copyAssetName')"
      data-slot="catalog-asset-name"
      @click="copy"
    >
      <span>{{ name }}</span>
      <LucideCheck v-if="copied" class="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <LucideCopy v-else class="size-3 shrink-0" aria-hidden="true" />
      <span class="sr-only" aria-live="polite">{{ copied ? t("catalog.detail.assetNameCopied") : "" }}</span>
    </button>
  </CatalogInfoRow>
</template>
