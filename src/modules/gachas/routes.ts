import type { RouteRecordRaw } from "vue-router"

export const gachasRoutes: RouteRecordRaw[] = [
    {
        path: "/gachas",
        name: "gachas.list",
        component: () => import("@/modules/gachas/views/GachaList.vue"),
        meta: { titleKey: "route.gachas.list" },
    },
    {
        path: "/gachas/:gachaId",
        name: "gachas.detail",
        component: () => import("@/modules/gachas/views/GachaDetail.vue"),
        meta: { titleKey: "route.gachas.detail" },
        props: true,
    },
]
