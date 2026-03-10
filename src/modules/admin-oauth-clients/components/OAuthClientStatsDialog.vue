<script setup lang="ts">
import type { OAuthClientStatistics } from "@/types/admin"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "vue-i18n"

const props = withDefaults(
  defineProps<{
    open: boolean
    loading: boolean
    stats: OAuthClientStatistics | null
  }>(),
  {
    stats: null,
  }
)

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
}>()
const { t } = useI18n()
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.statsDialog.title") }}</DialogTitle>
      </DialogHeader>
      <template v-if="props.loading">
        <Skeleton class="h-20 w-full" />
      </template>
      <template v-else-if="props.stats">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold">{{ props.stats.totalAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.totalAuthorizations") }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ props.stats.activeAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.activeAuthorizations") }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold">{{ props.stats.last30DaysAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.last30Days") }}</div>
          </div>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
