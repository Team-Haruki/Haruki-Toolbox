import type { RouteRecordRaw } from "vue-router"

export const homeRoutes: RouteRecordRaw[] = [
    {
        path: "",
        name: "home",
        component: () => import("@/modules/home/views/Home.vue"),
        meta: { titleKey: "route.home" },
    },
    {
        path: "/settings",
        redirect: "/",
        meta: { titleKey: "route.settings" },
    },
]
