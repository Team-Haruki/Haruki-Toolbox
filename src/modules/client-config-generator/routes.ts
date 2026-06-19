import type { RouteRecordRaw } from "vue-router"

export const clientConfigGeneratorRoutes: RouteRecordRaw[] = [
    {
        path: "/client-config-generator",
        component: () => import("@/modules/client-config-generator/views/ClientConfigGenerator.vue"),
        meta: { titleKey: "route.clientConfigGenerator" },
    },
]
