<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideShieldCheck } from "lucide-vue-next"
import { useAdminLayout } from "@/modules/admin/composables/useAdminLayout"
import AdminReauthDialog from "@/modules/admin/components/AdminReauthDialog.vue"
import { centeredScrollLeft, edgeOverflow } from "@/modules/admin/lib/nav-scroll"

const { userStore, visibleSections, visibleNavItems, activeItem, showPageHeader, pendingTicketCount } = useAdminLayout()
const { t } = useI18n()

function ticketBadge(count: number): string {
  return count > 99 ? "99+" : String(count)
}

// Mobile pill nav: the active pill is often past the right edge, so it is
// scrolled into view on every route change and the edges fade while more
// pills are hidden behind them.
const pillNav = useTemplateRef<HTMLElement>("pillNav")
const pillOverflow = ref({ start: false, end: false })
let resizeObserver: ResizeObserver | null = null

function updatePillOverflow() {
  const nav = pillNav.value
  if (!nav) return
  pillOverflow.value = edgeOverflow({
    scrollLeft: nav.scrollLeft,
    clientWidth: nav.clientWidth,
    scrollWidth: nav.scrollWidth,
  })
}

function scrollActivePillIntoView(behavior: "auto" | "smooth") {
  const nav = pillNav.value
  const value = activeItem.value?.value
  if (!nav || !value) return
  const pill = nav.querySelector<HTMLElement>(`[data-nav-item="${value}"]`)
  if (!pill) return
  nav.scrollTo({
    left: centeredScrollLeft(pill.offsetLeft, pill.offsetWidth, nav.clientWidth, nav.scrollWidth),
    behavior,
  })
  updatePillOverflow()
}

watch(() => activeItem.value?.value, () => {
  void nextTick(() => scrollActivePillIntoView("smooth"))
})

onMounted(() => {
  scrollActivePillIntoView("auto")
  if (typeof ResizeObserver !== "undefined" && pillNav.value) {
    resizeObserver = new ResizeObserver(updatePillOverflow)
    resizeObserver.observe(pillNav.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
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
    <div class="relative lg:hidden -mb-1">
      <!-- Scrollbar: hidden for mouse users, a thin one on touch as the "more" hint. -->
      <nav
        ref="pillNav"
        class="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:thin] [@media(pointer:fine)]:[scrollbar-width:none] [@media(pointer:fine)]:[&::-webkit-scrollbar]:hidden"
        @scroll.passive="updatePillOverflow"
      >
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.value"
          :to="{ name: item.routeName }"
          :data-nav-item="item.value"
          :aria-current="activeItem?.value === item.value ? 'page' : undefined"
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
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-200"
        :class="pillOverflow.start ? 'opacity-100' : 'opacity-0'"
      />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-200"
        :class="pillOverflow.end ? 'opacity-100' : 'opacity-0'"
      />
    </div>

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

    <!-- Password prompt for admin routes behind a recent-reauth check (see @/core/http/admin-reauth). -->
    <AdminReauthDialog />
  </div>
</template>
