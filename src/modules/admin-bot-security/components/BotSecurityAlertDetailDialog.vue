<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2, LucideEyeOff, LucideRotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatNumberCN } from "@/lib/number-format"
import BotSecurityEnforcementBadge from "@/modules/admin-bot-security/components/BotSecurityEnforcementBadge.vue"
import BotSecurityStatusBadge from "@/modules/admin-bot-security/components/BotSecurityStatusBadge.vue"
import {
  type BotSecurityAlertAction,
  botSecurityActionsFor,
  formatBotSecurityWindow,
  resolveBotSecurityHandlerLabel,
} from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert } from "@/types/admin"

const props = defineProps<{
  alert: BotSecurityAlert | null
  actionSaving: boolean
  kindLabel: (kind: string) => string
  statusLabel: (status: string) => string
  formatTime: (value?: string | null) => string
}>()

const open = defineModel<boolean>("open", { required: true })

const emit = defineEmits<{
  (event: "action", alert: BotSecurityAlert, action: BotSecurityAlertAction): void
}>()

const { t } = useI18n()

const ACTION_ICONS = {
  resolve: LucideCheckCircle2,
  ignore: LucideEyeOff,
  reopen: LucideRotateCcw,
} as const

function orFallback(value: string | null | undefined) {
  return value && value.trim() ? value : t("adminBotSecurity.common.fallback")
}

const rows = computed(() => {
  const alert = props.alert
  if (!alert) return []
  return [
    { key: "alertTime", label: t("adminBotSecurity.table.alertTime"), value: props.formatTime(alert.alertTime) },
    { key: "receivedAt", label: t("adminBotSecurity.detail.receivedAt"), value: props.formatTime(alert.receivedAt) },
    { key: "botId", label: t("adminBotSecurity.detail.botId"), value: orFallback(alert.botId), mono: true },
    { key: "ownerQq", label: t("adminBotSecurity.detail.ownerQq"), value: orFallback(alert.ownerQq), mono: true },
    { key: "sourceIp", label: t("adminBotSecurity.table.sourceIp"), value: orFallback(alert.sourceIp), mono: true },
    { key: "node", label: t("adminBotSecurity.detail.node"), value: orFallback(alert.node), mono: true },
    { key: "clientVersion", label: t("adminBotSecurity.detail.clientVersion"), value: orFallback(alert.clientVersion) },
    {
      key: "count",
      label: t("adminBotSecurity.table.count"),
      value: t("adminBotSecurity.detail.countValue", {
        count: formatNumberCN(alert.count, "0"),
        threshold: formatNumberCN(alert.threshold, "0"),
        window: formatBotSecurityWindow(alert.windowSeconds, t),
      }),
    },
  ]
})

const actions = computed(() => props.alert ? botSecurityActionsFor(props.alert.status) : [])
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminBotSecurity.detail.title", { id: props.alert?.id ?? "" }) }}</DialogTitle>
        <DialogDescription>{{ t("adminBotSecurity.detail.description") }}</DialogDescription>
      </DialogHeader>

      <div v-if="props.alert" class="min-w-0 space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium break-all">{{ props.kindLabel(props.alert.kind) }}</span>
          <span
            v-if="props.kindLabel(props.alert.kind) !== props.alert.kind"
            class="font-mono text-xs text-muted-foreground break-all"
          >{{ props.alert.kind }}</span>
          <BotSecurityEnforcementBadge :enforced="props.alert.enforced" />
          <BotSecurityStatusBadge :status="props.alert.status" :label="props.statusLabel(props.alert.status)" />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div v-for="row in rows" :key="row.key" class="min-w-0 space-y-1">
            <div class="text-xs text-muted-foreground">{{ row.label }}</div>
            <div :class="['text-sm break-all', row.mono ? 'font-mono' : '']">{{ row.value }}</div>
          </div>
          <div class="min-w-0 space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminBotSecurity.table.handler") }}</div>
            <div v-if="props.alert.handledBy" class="text-sm break-all">
              <RouterLink
                :to="{ name: 'admin.userDetail', params: { userId: props.alert.handledBy.userId } }"
                class="text-primary hover:underline"
              >
                {{ resolveBotSecurityHandlerLabel(props.alert.handledBy) }}
              </RouterLink>
              <span v-if="!props.alert.handledBy.name.trim()" class="ml-1 text-xs text-muted-foreground">
                {{ t("adminBotSecurity.detail.handlerNameUnavailable") }}
              </span>
            </div>
            <div v-else class="text-sm">{{ t("adminBotSecurity.common.fallback") }}</div>
          </div>
          <div class="min-w-0 space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminBotSecurity.detail.handledAt") }}</div>
            <div class="text-sm">{{ props.formatTime(props.alert.handledAt) }}</div>
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-xs text-muted-foreground">{{ t("adminBotSecurity.detail.buildId") }}</div>
          <div class="rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all">
            {{ orFallback(props.alert.buildId) }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground">{{ t("adminBotSecurity.detail.reason") }}</div>
          <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {{ orFallback(props.alert.reason) }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground">{{ t("adminBotSecurity.detail.note") }}</div>
          <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {{ props.alert.note || t("adminBotSecurity.detail.noNote") }}
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <DialogClose as-child>
          <Button variant="outline">{{ t("common.close") }}</Button>
        </DialogClose>
        <Button
          v-for="action in actions"
          :key="action"
          :variant="action === 'resolve' ? 'default' : 'secondary'"
          :disabled="props.actionSaving"
          @click="props.alert && emit('action', props.alert, action)"
        >
          <component :is="ACTION_ICONS[action]" class="w-4 h-4" />
          {{ t(`adminBotSecurity.actions.${action}`) }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
