import type { RouteRecordRaw } from "vue-router"

export const adminUserRoutes: RouteRecordRaw[] = [
    {
        path: "users",
        component: () => import("@/modules/admin-users/views/UserManagement.vue"),
        meta: { titleKey: "route.admin.users", requiresAdmin: true },
    },
    {
        path: "users/:userId",
        component: () => import("@/modules/admin-users/views/UserDetail.vue"),
        meta: { titleKey: "route.admin.userDetail", requiresAdmin: true },
        props: true,
    },
]
