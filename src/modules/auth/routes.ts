import type { RouteRecordRaw } from "vue-router"

export const authUserChildRoutes: RouteRecordRaw[] = [
    {
        path: "error",
        name: "user.error",
        component: () => import("@/modules/auth/views/Error.vue"),
        meta: { titleKey: "route.error" },
    },
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
        path: "recovery",
        name: "user.recovery",
        component: () => import("@/modules/auth/views/ResetPassword.vue"),
        meta: { titleKey: "route.resetPassword" },
    },
    {
        path: "verification",
        name: "user.verification",
        component: () => import("@/modules/auth/views/Verification.vue"),
        meta: { titleKey: "route.register" },
    },
    {
        path: "reset-password/:verifyHash",
        redirect: { name: "user.recovery" },
    },
]
