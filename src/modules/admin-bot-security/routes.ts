import type { RouteRecordRaw } from "vue-router"

export const adminBotSecurityRoutes: RouteRecordRaw[] = [
  {
    path: "bot-security",
    name: "admin.botSecurity",
    component: () => import("@/modules/admin-bot-security/views/BotSecurityAlerts.vue"),
    meta: { titleKey: "route.admin.botSecurity", requiresAdmin: true },
  },
]
