<script setup lang="ts">
/**
 * Add / edit one manual sponsorship duration in its own dialog, with its own
 * submit and cancel, so it never shares buttons with the profile editor.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2, LucideSave } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import FieldError from "@/shared/components/FieldError.vue"
import {
  SPONSOR_FIELD_IDS,
  type ManualDurationFormErrors,
} from "@/modules/admin-sponsors/composables/useAdminSponsorManagement"
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  type ManualDurationForm,
} from "@/modules/admin-sponsors/lib/manual-duration"

const props = defineProps<{
  open: boolean
  form: ManualDurationForm
  errors: ManualDurationFormErrors
  editing: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:form", value: ManualDurationForm): void
  (event: "save"): void
}>()

const { t } = useI18n()

function update<K extends keyof ManualDurationForm>(key: K, value: ManualDurationForm[K]) {
  emit("update:form", { ...props.form, [key]: value })
}

// The form keeps the backend-friendly local string; the picker speaks Date.
const startsAtDate = computed<Date | undefined>(() => {
  const iso = fromDateTimeLocalValue(props.form.startsAt)
  if (!iso) return undefined
  const date = new Date(iso)
  return Number.isNaN(date.valueOf()) ? undefined : date
})

function updateStartsAt(value?: Date) {
  update("startsAt", value ? toDateTimeLocalValue(value.toISOString()) : "")
}

function handleOpenChange(value: boolean) {
  if (!value && props.saving) return
  emit("update:open", value)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[min(32rem,92vw)]">
      <DialogHeader>
        <DialogTitle>
          {{ props.editing ? t("adminSponsors.duration.manual.editDialogTitle") : t("adminSponsors.duration.manual.addDialogTitle") }}
        </DialogTitle>
        <DialogDescription>{{ t("adminSponsors.duration.form.startsAtHelp") }}</DialogDescription>
      </DialogHeader>
      <form id="admin-sponsor-manual-form" class="grid gap-3" novalidate @submit.prevent="emit('save')">
        <div class="grid gap-3 sm:grid-cols-[8rem_8rem_1fr]">
          <div class="space-y-1.5">
            <Label :for="SPONSOR_FIELD_IDS.manualAmount">{{ t("adminSponsors.duration.form.amount") }}</Label>
            <Input
              :id="SPONSOR_FIELD_IDS.manualAmount"
              :model-value="props.form.amount"
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              :aria-invalid="!!props.errors.amount || undefined"
              :aria-describedby="props.errors.amount ? `${SPONSOR_FIELD_IDS.manualAmount}-error` : undefined"
              @update:model-value="update('amount', $event)"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="admin-sponsor-manual-unit">{{ t("adminSponsors.duration.form.unit") }}</Label>
            <NativeSelect
              id="admin-sponsor-manual-unit"
              :model-value="props.form.unit"
              class="w-full"
              @update:model-value="update('unit', $event === 'day' ? 'day' : 'month')"
            >
              <NativeSelectOption value="month">{{ t("adminSponsors.duration.form.units.month") }}</NativeSelectOption>
              <NativeSelectOption value="day">{{ t("adminSponsors.duration.form.units.day") }}</NativeSelectOption>
            </NativeSelect>
          </div>
          <div class="space-y-1.5">
            <Label for="admin-sponsor-manual-starts-at">{{ t("adminSponsors.duration.form.startsAt") }}</Label>
            <DateTimePicker24h
              id="admin-sponsor-manual-starts-at"
              :model-value="startsAtDate"
              :placeholder="t('adminSponsors.duration.form.startsAtPlaceholder')"
              @update:model-value="updateStartsAt"
            />
          </div>
        </div>
        <FieldError :id="`${SPONSOR_FIELD_IDS.manualAmount}-error`" :message="props.errors.amount" />
        <div class="space-y-1.5">
          <Label :for="SPONSOR_FIELD_IDS.manualNote">{{ t("adminSponsors.duration.form.note") }}</Label>
          <Input
            :id="SPONSOR_FIELD_IDS.manualNote"
            :model-value="props.form.note"
            maxlength="500"
            :placeholder="t('adminSponsors.duration.form.notePlaceholder')"
            :aria-invalid="!!props.errors.note || undefined"
            :aria-describedby="props.errors.note ? `${SPONSOR_FIELD_IDS.manualNote}-error` : undefined"
            @update:model-value="update('note', String($event ?? ''))"
          />
          <FieldError :id="`${SPONSOR_FIELD_IDS.manualNote}-error`" :message="props.errors.note" />
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" :disabled="props.saving" @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </Button>
        <Button type="submit" form="admin-sponsor-manual-form" :disabled="props.saving">
          <LucideLoader2 v-if="props.saving" class="mr-1.5 h-4 w-4 animate-spin" />
          <LucideSave v-else class="mr-1.5 h-4 w-4" />
          {{ props.editing ? t("common.save") : t("adminSponsors.duration.manual.add") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
