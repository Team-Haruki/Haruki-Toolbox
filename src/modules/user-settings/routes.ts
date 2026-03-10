import type { RouteRecordRaw } from "vue-router"

export const userSettingsChildRoutes: RouteRecordRaw[] = [
    {
        path: "settings",
        component: () => import("@/modules/user-settings/views/Settings.vue"),
        meta: { titleKey: "route.userSettings", requiresAuth: true },
    },
    {
        path: "game-account-bindings",
        component: () => import("@/modules/user-settings/views/GameAccountBinding.vue"),
        meta: { titleKey: "route.gameAccountBindings", requiresAuth: true },
    },
]

export const oauthConsentRoutes: RouteRecordRaw[] = [
    {
        path: "/oauth2/consent",
        component: () => import("@/modules/user-settings/views/OAuthConsent.vue"),
        meta: { titleKey: "route.oauthConsent", requiresAuth: true },
    },
]
