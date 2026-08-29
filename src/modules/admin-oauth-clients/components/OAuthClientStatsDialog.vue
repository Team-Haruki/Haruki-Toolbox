<script setup lang="ts">
import type { OAuthClientStatistics } from "@/types/admin"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LucideActivity, LucideBarChart3, LucideCalendarClock, LucideUsers } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

const props = withDefaults(
  defineProps<{
    open: boolean
    loading: boolean
    stats: OAuthClientStatistics | null
    clientId?: string
    statsFrom?: Date
    statsTo?: Date
    statsBucket: "hour" | "day"
  }>(),
  {
    stats: null,
    clientId: "",
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

const tiles = [
  { key: "totalAuthorizations", icon: LucideUsers, labelKey: "adminOAuthClients.statsDialog.totalAuthorizations" },
  { key: "activeAuthorizations", icon: LucideActivity, labelKey: "adminOAuthClients.statsDialog.activeAuthorizations" },
  { key: "last30DaysAuthorizations", icon: LucideCalendarClock, labelKey: "adminOAuthClients.statsDialog.last30Days" },
] as const
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.statsDialog.title") }}</DialogTitle>
        <DialogDescription v-if="props.clientId">
          <code class="rounded bg-muted px-1.5 py-0.5 text-xs">{{ props.clientId }}</code>
        </DialogDescription>
      </DialogHeader>

      <template v-if="props.loading">
        <div class="grid gap-3 sm:grid-cols-3">
          <Skeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-lg" />
        </div>
      </template>
      <template v-else-if="props.stats">
        <div class="grid gap-3 sm:grid-cols-3">
          <div v-for="tile in tiles" :key="tile.key" class="flex items-center gap-3 rounded-lg border p-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <component :is="tile.icon" class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="min-w-0">
              <div class="text-xl font-bold leading-tight tabular-nums">{{ props.stats[tile.key] }}</div>
              <div class="truncate text-xs text-muted-foreground">{{ t(tile.labelKey) }}</div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
          <LucideBarChart3 class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.common.empty") }}</p>
        </div>
      </template>

      <Separator />

      <div class="flex flex-col gap-3">
        <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {{ t("adminOAuthClients.statsDialog.filters") }}
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <Label for="oauth-stats-from" class="text-sm">{{ t("adminOAuthClients.statsDialog.from") }}</Label>
            <DateTimePicker24h
              id="oauth-stats-from"
              :model-value="props.statsFrom"
              :placeholder="t('adminOAuthClients.statsDialog.from')"
              @update:model-value="emit('update:statsFrom', $event)"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="oauth-stats-to" class="text-sm">{{ t("adminOAuthClients.statsDialog.to") }}</Label>
            <DateTimePicker24h
              id="oauth-stats-to"
              :model-value="props.statsTo"
              :placeholder="t('adminOAuthClients.statsDialog.to')"
              @update:model-value="emit('update:statsTo', $event)"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label for="oauth-stats-bucket" class="text-sm">{{ t("adminOAuthClients.statsDialog.bucket") }}</Label>
            <Select id="oauth-stats-bucket" :model-value="props.statsBucket" @update:model-value="value => emit('update:statsBucket', value === 'day' ? 'day' : 'hour')">
              <SelectTrigger id="oauth-stats-bucket" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">{{ t("adminOAuthClients.statsDialog.hour") }}</SelectItem>
                <SelectItem value="day">{{ t("adminOAuthClients.statsDialog.day") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex shrink-0 justify-end gap-2">
            <Button variant="outline" @click="emit('reset')">{{ t("common.reset") }}</Button>
            <Button :disabled="props.loading" @click="emit('apply')">{{ t("adminOAuthClients.statsDialog.apply") }}</Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
