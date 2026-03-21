<script setup lang="ts">
import type { OAuthClientStatistics } from "@/types/admin"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "vue-i18n"

const props = withDefaults(
  defineProps<{
    open: boolean
    loading: boolean
    stats: OAuthClientStatistics | null
    statsFrom?: Date
    statsTo?: Date
    statsBucket: "hour" | "day"
  }>(),
  {
    stats: null,
    statsFrom: undefined,
    statsTo: undefined,
  }
)

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:statsFrom", value: Date | undefined): void
  (event: "update:statsTo", value: Date | undefined): void
  (event: "update:statsBucket", value: "hour" | "day"): void
  (event: "apply"): void
  (event: "reset"): void
}>()
const { t } = useI18n()
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.statsDialog.title") }}</DialogTitle>
      </DialogHeader>
      <div class="grid gap-4 py-2 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminOAuthClients.statsDialog.from") }}</Label>
          <DateTimePicker24h
            :model-value="props.statsFrom"
            :placeholder="t('adminOAuthClients.statsDialog.from')"
            @update:model-value="emit('update:statsFrom', $event)"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminOAuthClients.statsDialog.to") }}</Label>
          <DateTimePicker24h
            :model-value="props.statsTo"
            :placeholder="t('adminOAuthClients.statsDialog.to')"
            @update:model-value="emit('update:statsTo', $event)"
          />
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <Label class="text-sm">{{ t("adminOAuthClients.statsDialog.bucket") }}</Label>
          <Select :model-value="props.statsBucket" @update:model-value="value => emit('update:statsBucket', value === 'day' ? 'day' : 'hour')">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">{{ t("adminOAuthClients.statsDialog.hour") }}</SelectItem>
              <SelectItem value="day">{{ t("adminOAuthClients.statsDialog.day") }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex justify-end gap-2 sm:col-span-2">
          <Button variant="outline" @click="emit('reset')">{{ t("common.reset") }}</Button>
          <Button @click="emit('apply')">{{ t("adminOAuthClients.statsDialog.apply") }}</Button>
        </div>
      </div>
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
      <template v-else>
        <div class="text-center text-sm text-muted-foreground py-4">
          {{ t("adminOAuthClients.common.empty") }}
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
