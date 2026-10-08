<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2, LucideEyeOff, LucideLoader2, LucideRotateCcw } from "lucide-vue-next"
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
import { Label } from "@/components/ui/label"
import {
  BOT_SECURITY_NOTE_MAX_LENGTH,
  type BotSecurityAlertAction,
} from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert } from "@/types/admin"

const props = defineProps<{
  alert: BotSecurityAlert | null
  action: BotSecurityAlertAction
  saving: boolean
  kindLabel: (kind: string) => string
}>()

const open = defineModel<boolean>("open", { required: true })
const note = defineModel<string>("note", { required: true })

const emit = defineEmits<{
  (event: "confirm"): void
}>()

const { t } = useI18n()

const ACTION_ICONS = {
  resolve: LucideCheckCircle2,
  ignore: LucideEyeOff,
  reopen: LucideRotateCcw,
} as const

const subject = computed(() => {
  const alert = props.alert
  if (!alert) return ""
  return alert.botId
    ? t("adminBotSecurity.actionDialog.subjectWithBot", { id: alert.id, kind: props.kindLabel(alert.kind), botId: alert.botId })
    : t("adminBotSecurity.actionDialog.subject", { id: alert.id, kind: props.kindLabel(alert.kind) })
})

const clearsNote = computed(() => !!props.alert?.note.trim() && !note.value.trim())
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{{ t(`adminBotSecurity.actionDialog.title.${props.action}`) }}</DialogTitle>
        <DialogDescription class="break-all">{{ subject }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label for="bot-security-action-note">{{ t("adminBotSecurity.actionDialog.noteLabel") }}</Label>
        <textarea
          id="bot-security-action-note"
          v-model="note"
          rows="4"
          :maxlength="BOT_SECURITY_NOTE_MAX_LENGTH"
          :placeholder="t('adminBotSecurity.actionDialog.notePlaceholder')"
          class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="props.saving"
        />
        <div class="flex items-start justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {{ clearsNote ? t("adminBotSecurity.actionDialog.noteWillClear") : t("adminBotSecurity.actionDialog.noteHint") }}
          </span>
          <span class="shrink-0 tabular-nums">{{ note.length }} / {{ BOT_SECURITY_NOTE_MAX_LENGTH }}</span>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" :disabled="props.saving">{{ t("common.cancel") }}</Button>
        </DialogClose>
        <Button :disabled="props.saving || !props.alert" @click="emit('confirm')">
          <LucideLoader2 v-if="props.saving" class="w-4 h-4 animate-spin" />
          <component :is="ACTION_ICONS[props.action]" v-else class="w-4 h-4" />
          {{ t(`adminBotSecurity.actions.${props.action}`) }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
