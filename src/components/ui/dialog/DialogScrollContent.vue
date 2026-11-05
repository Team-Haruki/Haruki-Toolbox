<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { X } from "lucide-vue-next"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"

const props = defineProps<DialogContentProps & {
  class?: HTMLAttributes["class"]
  /** Screen-reader-only description for dialogs without a visible `DialogDescription` (see DialogContent). */
  description?: string
}>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, "class", "description")

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const { t } = useI18n()
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      data-slot="dialog-overlay"
      class="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/16 dark:bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <DialogContent
        data-glass-surface="dialog"
        :class="
          cn(
            'pointer-events-auto relative z-50 my-4 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] gap-4 overflow-y-auto border p-4 duration-200 sm:my-8 sm:max-w-lg sm:rounded-lg sm:p-6 md:w-full',
            props.class,
          )
        "
        v-bind="forwarded"
        @pointer-down-outside="(event) => {
          const originalEvent = event.detail.originalEvent;
          const target = originalEvent.target as HTMLElement;
          if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
            event.preventDefault();
          }
        }"
      >
        <DialogDescription v-if="props.description" class="sr-only">
          {{ props.description }}
        </DialogDescription>

        <slot />

        <!-- Touch: ::after grows the 32px square to a 40px hit box. -->
        <DialogClose
          class="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-secondary sm:top-3 sm:right-3 pointer-coarse:after:absolute pointer-coarse:after:-top-2 pointer-coarse:after:-left-2 pointer-coarse:after:right-0 pointer-coarse:after:bottom-0 pointer-coarse:after:content-['']"
          :aria-label="t('common.close')"
        >
          <X class="w-4 h-4" />
          <span class="sr-only">{{ t("common.close") }}</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
