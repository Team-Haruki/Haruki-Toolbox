<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { UserRole } from "@/types/common"
import { roleLabel } from "@/modules/admin-users/constants"
import { ROLE_ICONS, ROLE_TONES } from "@/modules/admin-users/lib/user-display"
import UserChip from "./UserChip.vue"

defineProps<{ role: UserRole }>()

const { t } = useI18n()
</script>

<template>
  <UserChip :tone="ROLE_TONES[role] ?? 'default'" :icon="ROLE_ICONS[role]" :data-role="role">
    {{ roleLabel(role, t) }}
  </UserChip>
</template>
