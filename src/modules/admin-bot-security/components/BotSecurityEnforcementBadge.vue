<script setup lang="ts">
import { LucideFileText, LucideShieldBan } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  enforced: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
      props.enforced
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    ]"
    :title="props.enforced ? t('adminBotSecurity.enforcement.enforcedHint') : t('adminBotSecurity.enforcement.logOnlyHint')"
  >
    <LucideShieldBan v-if="props.enforced" class="size-3 shrink-0" aria-hidden="true" />
    <LucideFileText v-else class="size-3 shrink-0" aria-hidden="true" />
    {{ props.enforced ? t("adminBotSecurity.enforcement.enforced") : t("adminBotSecurity.enforcement.logOnly") }}
  </span>
</template>
