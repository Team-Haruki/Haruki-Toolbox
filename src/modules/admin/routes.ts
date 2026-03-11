import type { RouteRecordRaw } from "vue-router"
import { adminTicketRoutes } from "@/modules/tickets/routes"
import { adminUserRoutes } from "@/modules/admin-users/routes"
import { adminStatisticsRoutes } from "@/modules/admin-statistics/routes"
import { adminContentRoutes } from "@/modules/admin-content/routes"
import { adminRiskRoutes } from "@/modules/admin-risk/routes"
import { adminOAuthClientRoutes } from "@/modules/admin-oauth-clients/routes"
import { adminConfigRoutes } from "@/modules/admin-config/routes"
import { adminGameBindingRoutes } from "@/modules/admin-game-bindings/routes"
import { adminSessionRoutes } from "@/modules/admin-sessions/routes"

export const adminChildRoutes: RouteRecordRaw[] = [
    {
        path: "",
        redirect: "/admin/dashboard",
    },
    ...adminStatisticsRoutes,
    ...adminUserRoutes,
    ...adminOAuthClientRoutes,
    ...adminContentRoutes,
    ...adminConfigRoutes,
    ...adminGameBindingRoutes,
    ...adminSessionRoutes,
    ...adminRiskRoutes,
    ...adminTicketRoutes,
]

export const adminRoutes: RouteRecordRaw[] = [
    {
        path: "/admin",
        component: () => import("@/modules/admin/views/AdminLayout.vue"),
        meta: { titleKey: "route.admin.layout", requiresAuth: true, requiresAdmin: true },
        children: adminChildRoutes,
    },
]
