<template>
  <div class="flex flex-col items-center justify-center h-full w-full flex-1 text-center bg-base-100 p-6 rounded-lg shadow-lg">
    <LucideAlertCircle class="w-16 h-16 text-yellow-500" />
    <h2 class="text-3xl font-bold mt-4">{{ t("navigationPages.maintenance.title") }}</h2>
    <p class="text-gray-500 mt-2 text-lg">{{ displayMessage }}</p>
    <p v-if="maintenanceEnd" class="text-gray-400 text-sm mt-4">
      {{ t("navigationPages.maintenance.etaLabel") }}{{ maintenanceEnd }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideAlertCircle } from "lucide-vue-next"

const props = defineProps<{
  message?: string
  maintenanceEnd?: string | null
}>()
const { t } = useI18n()
const displayMessage = computed(
  () => props.message?.trim() || t("navigationPages.maintenance.defaultMessage")
)
</script>
