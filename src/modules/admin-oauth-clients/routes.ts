import type { RouteRecordRaw } from "vue-router"

export const adminOAuthClientRoutes: RouteRecordRaw[] = [
    {
        path: "oauth-clients",
        name: "admin.oauthClients",
        component: () => import("@/modules/admin-oauth-clients/views/OAuthClientManagement.vue"),
        meta: { titleKey: "route.admin.oauthClients", requiresAdmin: true },
    },
]
