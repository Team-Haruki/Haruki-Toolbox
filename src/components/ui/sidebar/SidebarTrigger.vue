<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { PanelLeft } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { useSidebar } from "./utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const { toggleSidebar } = useSidebar()
const { t } = useI18n()
</script>

<template>
  <!-- 40px hit area on touch layouts; the compact 28px square is desktop-only. -->
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('size-10 md:size-7', props.class)"
    :aria-label="t('sidebar.toggle')"
    :title="t('sidebar.toggle')"
    @click="toggleSidebar"
  >
    <PanelLeft />
    <span class="sr-only">{{ t("sidebar.toggle") }}</span>
  </Button>
</template>
