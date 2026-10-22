<script setup lang="ts">
import { watch } from "vue"
import { useRoute } from "vue-router"
import { useSidebar } from "@/components/ui/sidebar"

// Renders nothing. Lives inside SidebarProvider so it can reach the sidebar
// context: on mobile the sidebar is a sheet, and tapping a nav link must
// close it instead of leaving the new page hidden behind the overlay.
const route = useRoute()
const { isMobile, openMobile, setOpenMobile } = useSidebar()

watch(
  () => route.fullPath,
  () => {
    if (isMobile.value && openMobile.value) {
      setOpenMobile(false)
    }
  },
)
</script>

<template>
  <slot />
</template>
