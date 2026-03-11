import type { RouteRecordRaw } from "vue-router"

export const userSettingsChildRoutes: RouteRecordRaw[] = [
    {
        path: "settings",
        name: "user.settings",
        component: () => import("@/modules/user-settings/views/Settings.vue"),
        meta: { titleKey: "route.userSettings", requiresAuth: true },
    },
    {
        path: "game-account-bindings",
        name: "user.gameAccountBindings",
        component: () => import("@/modules/user-settings/views/GameAccountBinding.vue"),
        meta: { titleKey: "route.gameAccountBindings", requiresAuth: true },
    },
]

export const oauthConsentRoutes: RouteRecordRaw[] = [
    {
        path: "/oauth2/consent",
        name: "oauth.consent",
        component: () => import("@/modules/user-settings/views/OAuthConsent.vue"),
        meta: { titleKey: "route.oauthConsent", requiresAuth: true },
    },
]
