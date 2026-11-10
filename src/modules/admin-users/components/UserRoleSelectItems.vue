<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { SelectItem } from "@/components/ui/select"
import { roleLabel } from "@/modules/admin-users/constants"
import { ROLE_ICONS, ROLE_ICON_CLASS, USER_ROLES } from "@/modules/admin-users/lib/user-display"

/** The three roles as select items, shared by the filter, the batch action and the detail page. */
const { t } = useI18n()
</script>

<template>
  <SelectItem v-for="role in USER_ROLES" :key="role" :value="role">
    <div class="flex items-center gap-2">
      <component :is="ROLE_ICONS[role]" :class="['size-4', ROLE_ICON_CLASS[role]]" aria-hidden="true" />
      {{ roleLabel(role, t) }}
    </div>
  </SelectItem>
</template>
