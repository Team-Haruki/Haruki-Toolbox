<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { X } from "lucide-vue-next"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import DialogOverlay from "./DialogOverlay.vue"

const props = defineProps<DialogContentProps & {
  class?: HTMLAttributes["class"]
  /** Extra classes for the backdrop, e.g. a higher z-index for a dialog that must stack above another open dialog. */
  overlayClass?: HTMLAttributes["class"]
  /**
   * Screen-reader-only description, for dialogs with no visible
   * `DialogDescription` (reka-ui warns without one). Omit it when the dialog
   * renders its own `DialogDescription`.
   */
  description?: string
}>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "overlayClass", "description")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const { t } = useI18n()
</script>

<template>
  <DialogPortal>
    <DialogOverlay :class="props.overlayClass" />
    <DialogContent
      data-slot="dialog-content"
      data-glass-surface="dialog"
      v-bind="forwarded"
      :class="
        cn(
          'pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-lg border p-4 duration-200 sm:max-w-lg sm:p-6',
          props.class,
        )"
    >
      <DialogDescription v-if="props.description" class="sr-only">
        {{ props.description }}
      </DialogDescription>

      <slot />

      <!-- 32px square that stays within the p-4 inset; on touch an invisible
           ::after grows the hit box to 40px without moving the icon. -->
      <DialogClose
        class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none sm:top-3 sm:right-3 pointer-coarse:after:absolute pointer-coarse:after:-top-2 pointer-coarse:after:-left-2 pointer-coarse:after:right-0 pointer-coarse:after:bottom-0 pointer-coarse:after:content-[''] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        :aria-label="t('common.close')"
      >
        <X />
        <span class="sr-only">{{ t("common.close") }}</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
