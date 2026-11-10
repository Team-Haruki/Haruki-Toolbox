<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { resolveAccountStatus, STATUS_ICONS, STATUS_TONES } from "@/modules/admin-users/lib/user-display"
import UserChip from "./UserChip.vue"

const props = defineProps<{
  banned: boolean
  /** Soft-deleted by the legacy flow (a ban with a marker reason). */
  deleted?: boolean
}>()

const { t } = useI18n()

const status = computed(() => resolveAccountStatus(props))
</script>

<template>
  <UserChip :tone="STATUS_TONES[status]" :icon="STATUS_ICONS[status]" :data-status="status" :title="t(`adminUsers.status.${status}`)">
    {{ t(`adminUsers.status.${status}`) }}
  </UserChip>
</template>
