import type { RouteRecordRaw } from "vue-router"

export const authUserChildRoutes: RouteRecordRaw[] = [
    {
        path: "login",
        name: "user.login",
        component: () => import("@/modules/auth/views/Login.vue"),
        meta: { titleKey: "route.login", guestOnly: true },
    },
    {
        path: "register",
        name: "user.register",
        component: () => import("@/modules/auth/views/Register.vue"),
        meta: { titleKey: "route.register", guestOnly: true },
    },
    {
        path: "reset-password/:verifyHash",
        name: "reset-password",
        component: () => import("@/modules/auth/views/ResetPassword.vue"),
        meta: { titleKey: "route.resetPassword" },
    },
]
