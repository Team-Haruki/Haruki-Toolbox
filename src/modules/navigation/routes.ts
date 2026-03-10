import type { RouteRecordRaw } from "vue-router"

export const navigationRoutes: RouteRecordRaw[] = [
    {
        path: "/about",
        component: () => import("@/modules/navigation/views/Maintenance.vue"),
        meta: { titleKey: "route.about" },
    },
    {
        path: "/friend-groups",
        component: () => import("@/modules/navigation/views/FriendGroups.vue"),
        meta: { titleKey: "route.friendGroups" },
    },
    {
        path: "/friend-links",
        component: () => import("@/modules/navigation/views/FriendLinks.vue"),
        meta: { titleKey: "route.friendLinks" },
    },
]
