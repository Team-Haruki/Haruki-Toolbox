import type { RouteRecordRaw } from "vue-router"

export const adminSessionRoutes: RouteRecordRaw[] = [
    {
        path: "sessions",
        component: () => import("@/modules/admin-sessions/views/AdminSessions.vue"),
        meta: { titleKey: "route.admin.sessions", requiresAdmin: true },
    },
]
