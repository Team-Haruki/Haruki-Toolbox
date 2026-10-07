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
        path: "oauth-authorizations",
        name: "user.oauthAuthorizations",
        component: () => import("@/modules/user-settings/views/OAuthAuthorizations.vue"),
        meta: { titleKey: "route.oauthAuthorizations", requiresAuth: true },
    },
    {
        path: "harukibot-authorization",
        name: "user.harukiBotAuthorization",
        component: () => import("@/modules/user-settings/views/HarukiBotAuthorization.vue"),
        meta: { titleKey: "route.harukiBotAuthorization", requiresAuth: true },
    },
    {
        path: "game-account-bindings",
        name: "user.gameAccountBindings",
        component: () => import("@/modules/user-settings/views/GameAccountBinding.vue"),
        meta: { titleKey: "route.gameAccountBindings", requiresAuth: true },
    },
]

export const oauthBrowserFlowRoutes: RouteRecordRaw[] = [
    {
        path: "/oauth2/login",
        name: "oauth.login",
        component: () => import("@/modules/user-settings/views/OAuthLogin.vue"),
        meta: { titleKey: "route.oauthLogin" },
    },
    {
        path: "/oauth2/consent",
        name: "oauth.consent",
        component: () => import("@/modules/user-settings/views/OAuthConsent.vue"),
        meta: { titleKey: "route.oauthConsent", requiresAuth: true },
    },
    {
        // OAuth2 device authorization (RFC 8628) verification page. No auth
        // guard on purpose: the page shows its own sign-in card and returns
        // here with ?user_code= kept (design §5, "must log in first").
        path: "/device",
        name: "oauth.device",
        component: () => import("@/modules/user-settings/views/OAuthDevice.vue"),
        meta: { titleKey: "route.oauthDevice" },
    },
    {
        // Where Hydra's device chain ends (H9j). The backend only checks that
        // the chain reaches it and never follows it; a browser that lands
        // here anyway goes back to the page, without the query.
        path: "/device/done",
        redirect: { name: "oauth.device", query: {} },
    },
    {
        // Hydra's URLS_LOGOUT target for OIDC RP-initiated logout. No auth
        // guard: the logout_challenge is the credential, and the Kratos
        // session may already be half-dead when the user lands here.
        path: "/logout",
        name: "oauth.logout",
        component: () => import("@/modules/user-settings/views/OAuthLogout.vue"),
        meta: { titleKey: "route.oauthLogout" },
    },
]
