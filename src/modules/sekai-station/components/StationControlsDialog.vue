<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import StationControls from "@/modules/sekai-station/components/StationControls.vue"

/**
 * The filter column as a dialog, for widths where it does not fit beside the
 * list. Every change applies at once, so the only button closes it.
 */
const props = defineProps<{
  /** Scroll to this section when the dialog opens */
  section?: "blocked" | null
}>()

const open = defineModel<boolean>("open", { required: true })

const { t } = useI18n()
const body = ref<InstanceType<typeof DialogBody> | null>(null)

// Opened from the "hidden" count: start at that section instead of the first control
function onOpenAutoFocus(event: Event) {
  if (!props.section) {
    return
  }
  const root = body.value?.$el as HTMLElement | undefined
  const target = root?.querySelector<HTMLElement>(`[data-station-section="${props.section}"]`)
  if (target) {
    event.preventDefault()
    target.focus({ preventScroll: true })
    target.scrollIntoView({ block: "start" })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent size="sm" :description="t('sekaiStation.settings.description')" @open-auto-focus="onOpenAutoFocus">
      <DialogHeader>
        <DialogTitle>{{ t("sekaiStation.settings.title") }}</DialogTitle>
      </DialogHeader>
      <DialogBody ref="body">
        <StationControls layout="dialog" />
      </DialogBody>
      <DialogFooter>
        <Button type="button" @click="open = false">{{ t("sekaiStation.settings.done") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
