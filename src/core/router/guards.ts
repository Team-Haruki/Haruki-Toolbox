import { toast } from "vue-sonner"
import type { Router } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { ensureI18nBundles, translate } from "@/shared/i18n"
import { resolveI18nBundlesForPath } from "@/shared/i18n/bundles"
import { resolveSafeRedirectTarget } from "@/core/router/navigation"

export function setupRouteGuards(router: Router) {
    router.beforeEach((to) => {
        const userStore = useUserStore()
        userStore.checkExpiration()

        const hasKratosFlow = typeof to.query.flow === "string" && to.query.flow.trim() !== ""
        const allowGuestRouteForStepUp = to.name === "user.login" && hasKratosFlow

        if (to.meta.guestOnly && userStore.isLoggedIn && !allowGuestRouteForStepUp) {
            return resolveSafeRedirectTarget(to.query.redirect) ?? "/"
        }

        const requiresAuth = to.matched.some((record) =>
            record.meta.requiresAuth || record.meta.requiresAdmin || record.meta.requiresSuperAdmin
        )

        if (requiresAuth && !userStore.isLoggedIn) {
            if (to.path !== "/user/login" && to.query.reason !== "session-expired") {
                toast.error(translate("core.auth.loginRequiredTitle"), {
                    description: translate("core.auth.loginRequiredDescription"),
                })
            }
            return {
                path: "/user/login",
                query: { redirect: to.fullPath },
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
            return "/"
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
