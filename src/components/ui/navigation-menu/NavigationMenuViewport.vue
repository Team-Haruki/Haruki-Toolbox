<script setup lang="ts">
import type { NavigationMenuViewportProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  NavigationMenuViewport,

  useForwardProps,
} from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <div class="absolute top-full left-0 isolate z-50 flex justify-center">
    <NavigationMenuViewport
      data-slot="navigation-menu-viewport"
      data-glass-surface="popover"
      v-bind="forwardedProps"
      :class="
        cn(
          'origin-top-center border-white/65 bg-popover/84 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--reka-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow-[0_22px_64px_-38px_rgba(15,23,42,0.95),inset_0_1px_0_rgba(255,255,255,0.54)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-popover/58 md:w-[var(--reka-navigation-menu-viewport-width)] dark:border-white/12 dark:bg-slate-950/80 dark:shadow-[0_18px_54px_-36px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] dark:supports-[backdrop-filter]:bg-slate-950/62',
          props.class,
        )
      "
    />
  </div>
</template>
