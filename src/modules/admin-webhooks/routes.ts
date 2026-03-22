import type { RouteRecordRaw } from "vue-router"

export const adminWebhookRoutes: RouteRecordRaw[] = [
  {
    path: "webhooks",
    name: "admin.webhooks",
    component: () => import("@/modules/admin-webhooks/views/AdminWebhookManagement.vue"),
    meta: { titleKey: "route.admin.webhooks", requiresAdmin: true },
  },
]
