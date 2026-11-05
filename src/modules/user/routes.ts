import type { RouteRecordRaw } from "vue-router"
import { authUserChildRoutes } from "@/modules/auth/routes"
import { oauthBrowserFlowRoutes, userSettingsChildRoutes } from "@/modules/user-settings/routes"

export const userRoutes: RouteRecordRaw[] = [
    ...oauthBrowserFlowRoutes,
    {
        path: "/user",
        component: () => import("@/modules/user/views/UserLayout.vue"),
        children: [
            // `/user` on its own has nothing to show; account settings is its hub.
            { path: "", name: "user.index", redirect: { name: "user.settings" } },
            ...authUserChildRoutes,
            ...userSettingsChildRoutes,
        ],
    },
]
