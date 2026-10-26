import { toast } from "vue-sonner"
import type { Router } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { ensureI18nBundles, translate } from "@/shared/i18n"
import { resolveI18nBundlesForPath } from "@/shared/i18n/bundles"
import { resolveSafeRedirectTarget } from "@/core/router/navigation"
import { clearLoginReason, isLoginReason, rememberLoginReason } from "@/modules/auth/lib/login-reason"

export function setupRouteGuards(router: Router) {
    router.beforeEach((to) => {
        const userStore = useUserStore()
        userStore.checkExpiration()

        const hasKratosFlow = typeof to.query.flow === "string" && to.query.flow.trim() !== ""
        const allowGuestRouteForStepUp = to.name === "user.login" && hasKratosFlow

        if (to.name === "user.login") {
            // A reason arriving in the query (redirectToLogin, the guard below)
            // is kept for the document that comes back from Kratos.
            if (isLoginReason(to.query.reason)) {
                rememberLoginReason(to.query.reason)
            }
        } else {
            clearLoginReason()
        }

        if (to.meta.guestOnly && userStore.isLoggedIn && !allowGuestRouteForStepUp) {
            return resolveSafeRedirectTarget(to.query.redirect) ?? "/"
        }

        const requiresAuth = to.matched.some((record) =>
            record.meta.requiresAuth || record.meta.requiresAdmin || record.meta.requiresSuperAdmin
        )

        if (requiresAuth && !userStore.isLoggedIn) {
            const requiresRole = to.matched.some((record) => record.meta.requiresAdmin || record.meta.requiresSuperAdmin)
            const reason = requiresRole ? "admin-required" : "auth-required"
            // The login page hands the browser to Kratos right away, so a
            // toast here is lost; the page renders the reason inline instead.
            rememberLoginReason(reason)
            return {
                path: "/user/login",
                query: { redirect: to.fullPath, reason },
            }
        }

        // Role gates are evaluated even while settings are still syncing: the role
        // is already resolved from the Kratos session before the first navigation
        // (main.ts bootstrap / persisted session), so skipping these checks during
        // "loading" would let a non-super admin transiently reach a super-admin
        // route and never be re-checked once the sync completes.
        if (to.meta.requiresSuperAdmin && !userStore.isSuperAdmin) {
            toast.error(translate("core.auth.permissionDeniedTitle"), {
                description: translate("core.auth.requireSuperAdminDescription"),
            })
            // An admin who opens a super-admin page stays in the admin area;
            // only a normal user is sent back to the home page.
            return userStore.isAdmin ? "/admin/dashboard" : "/"
        }

        if (to.meta.requiresAdmin && !userStore.isAdmin) {
            toast.error(translate("core.auth.permissionDeniedTitle"), {
                description: translate("core.auth.requireAdminDescription"),
            })
            return "/"
        }
    })

    // Message bundles resolve before the page renders so no raw i18n keys
    // ever flash; bundle loads are memoized, so repeat navigations are free.
    router.beforeResolve(async (to) => {
        const bundles = resolveI18nBundlesForPath(to.path)
        if (bundles.length > 0) {
            await ensureI18nBundles(bundles)
        }
    })
}
