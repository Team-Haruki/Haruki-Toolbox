import type { RouteRecordRaw } from "vue-router"

export const playerProfileRoutes: RouteRecordRaw[] = [
    {
        path: "/profile/me",
        name: "playerProfile.me",
        component: () => import("@/modules/player-profile/views/PlayerProfile.vue"),
        meta: { titleKey: "route.playerProfile.me", requiresAuth: true },
    },
]
