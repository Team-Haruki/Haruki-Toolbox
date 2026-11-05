<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"

// The brand lives in the sidebar header. The top bar repeats it only while
// that header is out of sight: the sidebar is a sheet (phones) or the user
// collapsed it on desktop. Showing it next to an open sidebar doubled the
// brand on tablets; hiding it by breakpoint alone left a collapsed desktop
// without any brand. Lives inside SidebarProvider to read that state.
const { t } = useI18n()
const { isMobile, state } = useSidebar()
const visible = computed(() => isMobile.value || state.value === "collapsed")
</script>

<template>
  <!-- Never shrinks: a long page title truncates on its own instead of both ending in "…" (seen on a 390 px phone).
       Below 22rem of top bar (320 px phones, or larger text) the brand goes entirely so the title and the
       buttons still fit; the sidebar sheet keeps the brand there. The unit is rem on purpose: enlarged text
       widens the brand, and the breakpoint moves with it. -->
  <div v-if="visible" class="hidden shrink-0 items-center gap-2 @min-[22rem]:flex">
    <router-link to="/" class="flex min-h-10 items-center gap-1.5">
      <span class="text-lg font-bold leading-none">
        {{ t("app.name") }}
      </span>
    </router-link>
    <Separator orientation="vertical" class="mx-1 !h-6 bg-slate-300/70 dark:bg-cyan-400/25" />
  </div>
</template>
