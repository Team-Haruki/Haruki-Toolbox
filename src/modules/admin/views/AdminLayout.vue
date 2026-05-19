<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminLayout } from "@/modules/admin/composables/useAdminLayout"

const { userStore, visibleNavItems, activeTab, pendingTicketCount, onTabChange } = useAdminLayout()
const { t } = useI18n()
</script>

<template>
  <div class="w-full max-w-7xl mx-auto flex flex-col gap-4" v-if="userStore.isAdmin">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold tracking-tight">{{ t("route.admin.layout") }}</h1>
    </div>

    <Tabs :model-value="activeTab" @update:model-value="onTabChange" class="w-full">
      <TabsList
        data-glass-surface="admin-tabs"
        class="w-full flex overflow-x-auto overflow-y-hidden justify-start h-auto gap-1 rounded-lg border border-white/55 bg-white/58 p-1 shadow-[0_14px_38px_-34px_rgba(15,23,42,0.8)] backdrop-blur-md supports-[backdrop-filter]:bg-white/42 dark:border-white/10 dark:bg-slate-950/48 dark:supports-[backdrop-filter]:bg-slate-950/34 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      >
        <TabsTrigger
          v-for="item in visibleNavItems"
          :key="item.value"
          :value="item.value"
          class="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap shrink-0"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="inline">{{ t(item.labelKey) }}</span>
          <span
            v-if="item.value === 'tickets' && pendingTicketCount !== null && pendingTicketCount > 0"
            class="ml-0.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium leading-none text-destructive-foreground"
            :title="t('admin.nav.pendingTickets', { total: pendingTicketCount })"
          >
            {{ pendingTicketCount > 99 ? "99+" : pendingTicketCount }}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="flex-1">
      <router-view v-slot="{ Component, route }">
        <Transition name="page-blur-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>
