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
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
      props.enforced
        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    ]"
    :title="props.enforced ? t('adminBotSecurity.enforcement.enforcedHint') : t('adminBotSecurity.enforcement.logOnlyHint')"
  >
    <LucideShieldBan v-if="props.enforced" class="h-3 w-3 shrink-0" />
    <LucideFileText v-else class="h-3 w-3 shrink-0" />
    {{ props.enforced ? t("adminBotSecurity.enforcement.enforced") : t("adminBotSecurity.enforcement.logOnly") }}
  </span>
</template>
