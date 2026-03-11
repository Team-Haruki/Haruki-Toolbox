import type { RouteRecordRaw } from "vue-router"

export const adminGameBindingRoutes: RouteRecordRaw[] = [
    {
        path: "game-bindings",
        name: "admin.gameBindings",
        component: () => import("@/modules/admin-game-bindings/views/GameAccountBindings.vue"),
        meta: { titleKey: "route.admin.gameBindings", requiresAdmin: true },
    },
]
