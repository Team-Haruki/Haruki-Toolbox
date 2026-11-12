<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LucideLoader2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import {
  RISK_EVENT_FIELD_IDS,
  RISK_EVENT_SOURCE_OPTIONS,
  type RiskEventCreateErrors,
} from "@/modules/admin-risk/composables/useRiskEvents"

const props = defineProps<{
  open: boolean
  creating: boolean
  errors: RiskEventCreateErrors
}>()

const severity = defineModel<string>("severity", { required: true })
const source = defineModel<string>("source", { required: true })
const action = defineModel<string>("action", { required: true })
const reason = defineModel<string>("reason", { required: true })
const targetUserId = defineModel<string>("targetUserId", { required: true })

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "create"): void
}>()

const { t, locale } = useI18n()

// Least severe first, the order a form reads in.
const severityOptions = ["low", "medium", "high", "critical"] as const

function updateSeverity(value: unknown) {
  if (typeof value === "string") severity.value = value
}

function updateSource(value: unknown) {
  if (typeof value === "string") source.value = value
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent :description="t('adminRisk.events.createDialogTitle')">
      <DialogHeader>
        <DialogTitle>{{ t("adminRisk.events.createDialogTitle") }}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <form id="risk-event-create-form" class="grid gap-3" novalidate @submit.prevent="emit('create')">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="flex min-w-0 flex-col gap-1.5">
              <Label id="risk-event-severity-label" for="risk-event-severity">{{ t("adminRisk.events.fields.severity") }}</Label>
              <Select id="risk-event-severity" :key="locale" :model-value="severity" @update:model-value="updateSeverity">
                <SelectTrigger aria-labelledby="risk-event-severity-label" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in severityOptions" :key="option" :value="option">
                    {{ t(`adminRisk.severity.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex min-w-0 flex-col gap-1.5">
              <Label id="risk-event-source-label" for="risk-event-source">{{ t("adminRisk.events.fields.source") }}</Label>
              <Select id="risk-event-source" :key="locale" :model-value="source" @update:model-value="updateSource">
                <SelectTrigger aria-labelledby="risk-event-source-label" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in RISK_EVENT_SOURCE_OPTIONS" :key="option" :value="option">
                    {{ t(`adminRisk.events.sourceOptions.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label :for="RISK_EVENT_FIELD_IDS.action">{{ t("adminRisk.events.fields.action") }}</Label>
            <Input
              :id="RISK_EVENT_FIELD_IDS.action"
              v-model="action"
              :placeholder="t('adminRisk.events.placeholders.action')"
              :aria-invalid="!!props.errors.action || undefined"
              :aria-describedby="props.errors.action ? `${RISK_EVENT_FIELD_IDS.action}-error` : undefined"
            />
            <FieldError :id="`${RISK_EVENT_FIELD_IDS.action}-error`" :message="props.errors.action" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label :for="RISK_EVENT_FIELD_IDS.reason">{{ t("adminRisk.events.fields.reason") }}</Label>
            <textarea
              :id="RISK_EVENT_FIELD_IDS.reason"
              v-model="reason"
              :placeholder="t('adminRisk.events.placeholders.reason')"
              rows="3"
              :aria-invalid="!!props.errors.reason || undefined"
              :aria-describedby="props.errors.reason ? `${RISK_EVENT_FIELD_IDS.reason}-error` : undefined"
              class="flex w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            />
            <FieldError :id="`${RISK_EVENT_FIELD_IDS.reason}-error`" :message="props.errors.reason" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="risk-event-target-user">{{ t("adminRisk.events.fields.targetUserIdOptional") }}</Label>
            <Input
              id="risk-event-target-user"
              v-model="targetUserId"
              :placeholder="t('adminRisk.events.placeholders.targetUserId')"
            />
          </div>
        </form>
      </DialogBody>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" :disabled="props.creating">
            {{ t("common.cancel") }}
          </Button>
        </DialogClose>
        <Button type="submit" form="risk-event-create-form" :disabled="props.creating">
          <LucideLoader2 v-if="props.creating" class="size-4 animate-spin" aria-hidden="true" />
          {{ t("adminRisk.events.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
