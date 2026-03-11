<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminLayout } from "@/modules/admin/composables/useAdminLayout"

const { userStore, visibleNavItems, activeTab, onTabChange } = useAdminLayout()
const { t } = useI18n()
</script>

<template>
  <div class="w-full max-w-7xl mx-auto flex flex-col gap-4" v-if="userStore.isAdmin">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold tracking-tight">{{ t("route.admin.layout") }}</h1>
    </div>

    <Tabs :model-value="activeTab" @update:model-value="onTabChange" class="w-full">
      <TabsList class="w-full flex overflow-x-auto overflow-y-hidden justify-start h-auto gap-1 bg-muted/50 p-1 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <TabsTrigger
          v-for="item in visibleNavItems"
          :key="item.value"
          :value="item.value"
          class="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap shrink-0"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="inline">{{ t(item.labelKey) }}</span>
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
