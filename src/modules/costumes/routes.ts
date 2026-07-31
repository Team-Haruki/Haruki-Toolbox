import type { RouteRecordRaw } from "vue-router"

export const costumesRoutes: RouteRecordRaw[] = [
    {
        path: "/costumes",
        name: "costumes.dressup",
        component: () => import("@/modules/costumes/views/CostumeDressup.vue"),
        meta: { titleKey: "route.costumes.dressup" },
    },
]
