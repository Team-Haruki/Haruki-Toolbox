import type { RouteRecordRaw } from "vue-router"
import { authUserChildRoutes } from "@/modules/auth/routes"
import { oauthConsentRoutes, userSettingsChildRoutes } from "@/modules/user-settings/routes"

export const userRoutes: RouteRecordRaw[] = [
    ...oauthConsentRoutes,
    {
        path: "/user",
        component: () => import("@/modules/user/views/UserLayout.vue"),
        children: [
            ...authUserChildRoutes,
            ...userSettingsChildRoutes,
        ],
    },
]
