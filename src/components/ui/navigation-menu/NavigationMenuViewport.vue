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
          'origin-top-center border-white/55 bg-popover/92 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--reka-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow-[0_16px_44px_-28px_rgba(15,23,42,0.9)] backdrop-blur-xl supports-[backdrop-filter]:bg-popover/78 md:w-[var(--reka-navigation-menu-viewport-width)] dark:border-white/10 dark:bg-slate-950/88 dark:supports-[backdrop-filter]:bg-slate-950/74',
          props.class,
        )
      "
    />
  </div>
</template>
