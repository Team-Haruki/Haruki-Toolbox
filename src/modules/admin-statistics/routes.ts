import type { RouteRecordRaw } from "vue-router"

export const adminStatisticsRoutes: RouteRecordRaw[] = [
    {
        path: "dashboard",
        name: "admin.dashboard",
        component: () => import("@/modules/admin-statistics/views/Dashboard.vue"),
        meta: { titleKey: "route.admin.dashboard", requiresAdmin: true },
    },
    {
        path: "logs",
        name: "admin.logs",
        component: () => import("@/modules/admin-statistics/views/SystemLogs.vue"),
        meta: { titleKey: "route.admin.logs", requiresAdmin: true },
    },
    {
        path: "upload-logs",
        name: "admin.uploadLogs",
        component: () => import("@/modules/admin-statistics/views/UploadLogs.vue"),
        meta: { titleKey: "route.admin.uploadLogs", requiresAdmin: true },
    },
]
