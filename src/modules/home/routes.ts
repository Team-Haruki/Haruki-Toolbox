import type { RouteRecordRaw } from "vue-router"

export const homeRoutes: RouteRecordRaw[] = [
    {
        path: "",
        name: "home",
        component: () => import("@/modules/home/views/Home.vue"),
        meta: { titleKey: "route.home" },
    },
    {
        // A link or bookmark to /settings lands on the home page with the
        // settings dialog open (WebLayout reads `openSettings`), then the
        // address is replaced with "/" so closing the dialog does not reopen it.
        path: "/settings",
        name: "settings",
        component: () => import("@/modules/home/views/Home.vue"),
        meta: { titleKey: "route.settings", openSettings: true },
    },
]
