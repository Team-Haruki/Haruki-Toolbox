import type { RouteRecordRaw } from "vue-router"

export const botNeoRoutes: RouteRecordRaw[] = [
  {
    path: "/haruki-bot-neo",
    component: () => import("@/modules/haruki-bot-neo/views/BotNeoRegistration.vue"),
    meta: { titleKey: "route.botNeoRegistration", requiresAuth: true },
  },
]
