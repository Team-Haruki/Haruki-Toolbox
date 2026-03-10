import type { RouteRecordRaw } from "vue-router"

export const adminContentRoutes: RouteRecordRaw[] = [
    {
        path: "content",
        component: () => import("@/modules/admin-content/views/ContentManagement.vue"),
        meta: { titleKey: "route.admin.content", requiresAdmin: true },
    },
]
