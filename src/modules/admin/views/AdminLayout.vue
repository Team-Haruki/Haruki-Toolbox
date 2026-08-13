<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideShieldCheck } from "lucide-vue-next"
import { useAdminLayout } from "@/modules/admin/composables/useAdminLayout"

const { userStore, visibleSections, visibleNavItems, activeItem, showPageHeader, pendingTicketCount } = useAdminLayout()
const { t } = useI18n()

function ticketBadge(count: number): string {
  return count > 99 ? "99+" : String(count)
}
</script>

<template>
  <div v-if="userStore.isAdmin" class="w-full max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
    <!-- Desktop: grouped secondary nav -->
    <aside class="hidden lg:flex w-52 shrink-0 flex-col gap-5 lg:sticky lg:top-20">
      <div class="flex items-center gap-2 px-2.5">
        <LucideShieldCheck class="h-5 w-5 text-primary" />
        <div class="min-w-0">
          <p class="text-sm font-bold leading-tight">{{ t("route.admin.layout") }}</p>
          <p v-if="userStore.isSuperAdmin" class="text-[11px] text-muted-foreground">
            {{ t("admin.layout.superAdmin") }}
          </p>
        </div>
      </div>

      <nav v-for="section in visibleSections" :key="section.labelKey" class="flex flex-col gap-1">
        <p class="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {{ t(section.labelKey) }}
        </p>
        <RouterLink
          v-for="item in section.items"
          :key="item.value"
          :to="{ name: item.routeName }"
          class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
          :class="activeItem?.value === item.value
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ t(item.labelKey) }}</span>
          <span
            v-if="item.value === 'tickets' && pendingTicketCount !== null && pendingTicketCount > 0"
            class="shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium leading-none text-destructive-foreground"
            :title="t('admin.nav.pendingTickets', { total: pendingTicketCount })"
          >
            {{ ticketBadge(pendingTicketCount) }}
          </span>
        </RouterLink>
      </nav>
    </aside>

    <!-- Mobile / tablet: horizontal pill nav -->
    <nav class="lg:hidden -mb-1 flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
      <RouterLink
        v-for="item in visibleNavItems"
        :key="item.value"
        :to="{ name: item.routeName }"
        class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
        :class="activeItem?.value === item.value
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'"
      >
        <component :is="item.icon" class="h-3.5 w-3.5" />
        {{ t(item.labelKey) }}
        <span
          v-if="item.value === 'tickets' && pendingTicketCount !== null && pendingTicketCount > 0"
          class="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium leading-none text-destructive-foreground"
        >
          {{ ticketBadge(pendingTicketCount) }}
        </span>
      </RouterLink>
    </nav>

    <!-- Content -->
    <div class="min-w-0 flex-1 flex flex-col gap-4">
      <header v-if="activeItem && showPageHeader" class="space-y-0.5">
        <h1 class="flex items-center gap-2 text-xl font-bold tracking-tight">
          <component :is="activeItem.icon" class="h-5 w-5 text-muted-foreground" />
          {{ t(activeItem.labelKey) }}
        </h1>
        <p class="text-sm text-muted-foreground">{{ t(activeItem.descriptionKey) }}</p>
      </header>

      <router-view v-slot="{ Component, route }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>
