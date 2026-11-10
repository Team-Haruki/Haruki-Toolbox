<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2 } from "lucide-vue-next"
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
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import type { RiskEventItem } from "@/modules/admin-risk/api/types"
import RiskSeverityBadge from "@/modules/admin-risk/components/RiskSeverityBadge.vue"
import RiskStatusBadge from "@/modules/admin-risk/components/RiskStatusBadge.vue"

/**
 * Everything the backend holds about one event, in groups: what happened,
 * who it concerns, how it was resolved, and the raw metadata.
 */
const props = defineProps<{
  event: RiskEventItem | null
  actionLoading: boolean
  formatDate: (value?: string | null) => string
}>()

const open = defineModel<boolean>("open", { required: true })

const emit = defineEmits<{
  (event: "resolve", item: RiskEventItem): void
}>()

const { t } = useI18n()

function orFallback(value: string | null | undefined) {
  return value && value.trim() ? value : t("adminRisk.common.fallback")
}

type UserFact = { key: string; label: string; userId: string }

const userFacts = computed<UserFact[]>(() => {
  const event = props.event
  if (!event) return []
  return [
    { key: "target", label: t("adminRisk.detail.targetUser"), userId: event.targetUserId },
    { key: "actor", label: t("adminRisk.detail.actorUser"), userId: event.actorUserId },
  ]
})

/** Written by the backend when an event is resolved with a reason. */
const resolutionReason = computed(() => {
  const reason = props.event?.metadata?.resolutionReason
  return typeof reason === "string" && reason.trim() ? reason : null
})

const metadataText = computed(() => (props.event?.metadata ? JSON.stringify(props.event.metadata, null, 2) : null))

const DT = "w-24 shrink-0 text-xs leading-5 text-muted-foreground"
const DD = "min-w-0 flex-1 text-sm [overflow-wrap:anywhere]"
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminRisk.detail.title", { id: props.event?.id ?? "" }) }}</DialogTitle>
        <DialogDescription class="[overflow-wrap:anywhere]">{{ props.event?.action || t("adminRisk.detail.noAction") }}</DialogDescription>
      </DialogHeader>

      <div v-if="props.event" class="flex min-w-0 flex-col gap-4">
        <div class="flex flex-wrap items-center gap-1.5">
          <RiskSeverityBadge :severity="props.event.severity" />
          <RiskStatusBadge :status="props.event.status" />
        </div>

        <SettingsGroup :title="t('adminRisk.detail.groups.event')">
          <dl class="divide-y divide-border/60">
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.events.table.time") }}</dt>
              <dd :class="[DD, 'tabular-nums']">{{ props.formatDate(props.event.eventTime) }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.events.fields.source") }}</dt>
              <dd :class="DD">{{ orFallback(props.event.source) }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.events.fields.action") }}</dt>
              <dd :class="[DD, 'font-mono text-[13px]']">{{ orFallback(props.event.action) }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.events.fields.reason") }}</dt>
              <dd :class="[DD, 'whitespace-pre-wrap']">{{ orFallback(props.event.reason) }}</dd>
            </div>
          </dl>
        </SettingsGroup>

        <SettingsGroup :title="t('adminRisk.detail.groups.parties')">
          <dl class="divide-y divide-border/60">
            <div v-for="fact in userFacts" :key="fact.key" class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ fact.label }}</dt>
              <dd :class="[DD, 'font-mono text-[13px]']">
                <RouterLink
                  v-if="fact.userId"
                  :to="{ name: 'admin.userDetail', params: { userId: fact.userId } }"
                  class="text-primary underline-offset-4 hover:underline"
                >
                  {{ fact.userId }}
                </RouterLink>
                <template v-else>{{ t("adminRisk.common.fallback") }}</template>
              </dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.detail.ip") }}</dt>
              <dd :class="[DD, 'font-mono text-[13px]']">{{ orFallback(props.event.ip) }}</dd>
            </div>
          </dl>
        </SettingsGroup>

        <SettingsGroup v-if="props.event.status !== 'open'" :title="t('adminRisk.detail.groups.resolution')">
          <dl class="divide-y divide-border/60">
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.detail.resolvedAt") }}</dt>
              <dd :class="[DD, 'tabular-nums']">{{ props.formatDate(props.event.resolvedAt) }}</dd>
            </div>
            <div class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.detail.resolvedBy") }}</dt>
              <dd :class="[DD, 'font-mono text-[13px]']">
                <RouterLink
                  v-if="props.event.resolvedBy"
                  :to="{ name: 'admin.userDetail', params: { userId: props.event.resolvedBy } }"
                  class="text-primary underline-offset-4 hover:underline"
                >
                  {{ props.event.resolvedBy }}
                </RouterLink>
                <template v-else>{{ t("adminRisk.common.fallback") }}</template>
              </dd>
            </div>
            <div v-if="resolutionReason" class="flex gap-3 px-4 py-2.5">
              <dt :class="DT">{{ t("adminRisk.detail.resolutionReason") }}</dt>
              <dd :class="[DD, 'whitespace-pre-wrap']">{{ resolutionReason }}</dd>
            </div>
          </dl>
        </SettingsGroup>

        <SettingsGroup v-if="metadataText" :title="t('adminRisk.detail.groups.metadata')">
          <pre class="max-h-64 overflow-y-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">{{ metadataText }}</pre>
        </SettingsGroup>
      </div>

      <DialogFooter class="gap-2">
        <DialogClose as-child>
          <Button variant="outline">{{ t("common.close") }}</Button>
        </DialogClose>
        <Button
          v-if="props.event?.status === 'open'"
          :disabled="props.actionLoading"
          @click="props.event && emit('resolve', props.event)"
        >
          <LucideCheckCircle2 class="size-4" aria-hidden="true" />
          {{ t("adminRisk.events.resolveAction") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
