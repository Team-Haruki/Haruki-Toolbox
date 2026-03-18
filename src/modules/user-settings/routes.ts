import type { RouteRecordRaw } from "vue-router"

export const userSettingsChildRoutes: RouteRecordRaw[] = [
    {
        path: "settings",
        name: "user.settings",
        component: () => import("@/modules/user-settings/views/Settings.vue"),
        meta: { titleKey: "route.userSettings", requiresAuth: true },
    },
    {
        path: "identity-settings",
        name: "user.identitySettings",
        component: () => import("@/modules/user-settings/views/IdentitySettings.vue"),
        meta: { titleKey: "route.userIdentitySettings", requiresAuth: true },
    },
    {
        path: "identity-settings/profile",
        name: "user.identityProfileSettings",
        component: () => import("@/modules/user-settings/views/IdentityProfileSettings.vue"),
        meta: { titleKey: "route.userIdentityProfileSettings", requiresAuth: true },
    },
    {
        path: "identity-settings/password",
        name: "user.identityPasswordSettings",
        component: () => import("@/modules/user-settings/views/IdentityPasswordSettings.vue"),
        meta: { titleKey: "route.userIdentityPasswordSettings", requiresAuth: true },
    },
    {
        path: "identity-settings/mfa",
        name: "user.identityMfaSettings",
        component: () => import("@/modules/user-settings/views/IdentityMfaSettings.vue"),
        meta: { titleKey: "route.userIdentityMfaSettings", requiresAuth: true },
    },
    {
        path: "identity-settings/social",
        name: "user.identitySocialSettings",
        component: () => import("@/modules/user-settings/views/IdentitySocialSettings.vue"),
        meta: { titleKey: "route.userIdentitySocialSettings", requiresAuth: true },
    },
    {
        path: "identity-settings/sessions",
        name: "user.identitySessionSettings",
        component: () => import("@/modules/user-settings/views/IdentitySessionSettings.vue"),
        meta: { titleKey: "route.userIdentitySessionSettings", requiresAuth: true },
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
