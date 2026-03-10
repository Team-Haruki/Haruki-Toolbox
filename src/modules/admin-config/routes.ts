import type { RouteRecordRaw } from "vue-router"

export const adminConfigRoutes: RouteRecordRaw[] = [
    {
        path: "config",
        component: () => import("@/modules/admin-config/views/SystemConfig.vue"),
        meta: { titleKey: "route.admin.config", requiresAdmin: true, requiresSuperAdmin: true },
    },
]
