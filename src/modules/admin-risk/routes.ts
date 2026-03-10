import type { RouteRecordRaw } from "vue-router"

export const adminRiskRoutes: RouteRecordRaw[] = [
    {
        path: "risk",
        component: () => import("@/modules/admin-risk/views/RiskManagement.vue"),
        meta: { titleKey: "route.admin.risk", requiresAdmin: true },
    },
]
