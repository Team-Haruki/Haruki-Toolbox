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
import { LucideBarChart3 } from "lucide-vue-next"
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
        <div class="grid gap-3 sm:grid-cols-3">
          <Skeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-lg" />
        </div>
      </template>
      <template v-else-if="props.stats">
        <div class="grid gap-3 text-center sm:grid-cols-3">
          <div class="rounded-lg border p-3">
            <div class="text-2xl font-bold tabular-nums">{{ props.stats.totalAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.totalAuthorizations") }}</div>
          </div>
          <div class="rounded-lg border p-3">
            <div class="text-2xl font-bold tabular-nums">{{ props.stats.activeAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.activeAuthorizations") }}</div>
          </div>
          <div class="rounded-lg border p-3">
            <div class="text-2xl font-bold tabular-nums">{{ props.stats.last30DaysAuthorizations }}</div>
            <div class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.last30Days") }}</div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
          <LucideBarChart3 class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.common.empty") }}</p>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
