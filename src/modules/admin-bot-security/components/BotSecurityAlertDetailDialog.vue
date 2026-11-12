<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2, LucideEyeOff, LucideRotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatNumberCN } from "@/lib/number-format"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import BotSecurityKindChip from "@/modules/admin-bot-security/components/BotSecurityKindChip.vue"
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

type Fact = { key: string; label: string; value: string; mono?: boolean }

// The facts in three groups: what fired, who it was about, what was done.
const alertFacts = computed<Fact[]>(() => {
  const alert = props.alert
  if (!alert) return []
  return [
    { key: "alertTime", label: t("adminBotSecurity.table.alertTime"), value: props.formatTime(alert.alertTime) },
    { key: "receivedAt", label: t("adminBotSecurity.detail.receivedAt"), value: props.formatTime(alert.receivedAt) },
    {
      key: "count",
      label: t("adminBotSecurity.table.count"),
      value: t("adminBotSecurity.detail.countValue", {
        count: formatNumberCN(alert.count, "0"),
        threshold: formatNumberCN(alert.threshold, "0"),
        window: formatBotSecurityWindow(alert.windowSeconds, t),
      }),
    },
    { key: "node", label: t("adminBotSecurity.detail.node"), value: orFallback(alert.node), mono: true },
  ]
})

const sourceFacts = computed<Fact[]>(() => {
  const alert = props.alert
  if (!alert) return []
  return [
    { key: "botId", label: t("adminBotSecurity.detail.botId"), value: orFallback(alert.botId), mono: true },
    { key: "ownerQq", label: t("adminBotSecurity.detail.ownerQq"), value: orFallback(alert.ownerQq), mono: true },
    { key: "sourceIp", label: t("adminBotSecurity.table.sourceIp"), value: orFallback(alert.sourceIp), mono: true },
    { key: "clientVersion", label: t("adminBotSecurity.detail.clientVersion"), value: orFallback(alert.clientVersion) },
    { key: "buildId", label: t("adminBotSecurity.detail.buildId"), value: orFallback(alert.buildId), mono: true },
  ]
})

const actions = computed(() => props.alert ? botSecurityActionsFor(props.alert.status) : [])
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>{{ t("adminBotSecurity.detail.title", { id: props.alert?.id ?? "" }) }}</DialogTitle>
        <DialogDescription>{{ t("adminBotSecurity.detail.description") }}</DialogDescription>
      </DialogHeader>

      <DialogBody v-if="props.alert">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <BotSecurityKindChip :kind="props.alert.kind" :label="props.kindLabel(props.alert.kind)" />
          <BotSecurityEnforcementBadge :enforced="props.alert.enforced" />
          <BotSecurityStatusBadge :status="props.alert.status" :label="props.statusLabel(props.alert.status)" />
          <span
            v-if="props.kindLabel(props.alert.kind) !== props.alert.kind"
            class="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]"
          >{{ props.alert.kind }}</span>
        </div>

        <SettingsGroup :title="t('adminBotSecurity.detail.groups.alert')">
          <dl class="divide-y divide-border/60">
            <div v-for="fact in alertFacts" :key="fact.key" class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ fact.label }}</dt>
              <dd :class="['min-w-0 flex-1 text-sm tabular-nums [overflow-wrap:anywhere]', fact.mono ? 'font-mono text-[13px]' : '']">{{ fact.value }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ t("adminBotSecurity.detail.reason") }}</dt>
              <dd class="min-w-0 flex-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{{ orFallback(props.alert.reason) }}</dd>
            </div>
          </dl>
        </SettingsGroup>

        <SettingsGroup :title="t('adminBotSecurity.detail.groups.source')">
          <dl class="divide-y divide-border/60">
            <div v-for="fact in sourceFacts" :key="fact.key" class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ fact.label }}</dt>
              <dd :class="['min-w-0 flex-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]', fact.mono ? 'font-mono text-[13px]' : '']">{{ fact.value }}</dd>
            </div>
          </dl>
        </SettingsGroup>

        <SettingsGroup :title="t('adminBotSecurity.detail.groups.handling')">
          <dl class="divide-y divide-border/60">
            <div class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ t("adminBotSecurity.table.handler") }}</dt>
              <dd v-if="props.alert.handledBy" class="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">
                <RouterLink
                  :to="{ name: 'admin.userDetail', params: { userId: props.alert.handledBy.userId } }"
                  class="text-primary underline-offset-4 hover:underline"
                >
                  {{ resolveBotSecurityHandlerLabel(props.alert.handledBy) }}
                </RouterLink>
                <span v-if="!props.alert.handledBy.name.trim()" class="ml-1 text-xs text-muted-foreground">
                  {{ t("adminBotSecurity.detail.handlerNameUnavailable") }}
                </span>
              </dd>
              <dd v-else class="min-w-0 flex-1 text-sm">{{ t("adminBotSecurity.common.fallback") }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ t("adminBotSecurity.detail.handledAt") }}</dt>
              <dd class="min-w-0 flex-1 text-sm tabular-nums">{{ props.formatTime(props.alert.handledAt) }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt class="w-24 shrink-0 text-xs leading-5 text-muted-foreground">{{ t("adminBotSecurity.detail.note") }}</dt>
              <dd :class="['min-w-0 flex-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]', props.alert.note ? '' : 'text-muted-foreground']">
                {{ props.alert.note || t("adminBotSecurity.detail.noNote") }}
              </dd>
            </div>
          </dl>
        </SettingsGroup>
      </DialogBody>

      <DialogFooter>
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
          <component :is="ACTION_ICONS[action]" class="size-4" aria-hidden="true" />
          {{ t(`adminBotSecurity.actions.${action}`) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
