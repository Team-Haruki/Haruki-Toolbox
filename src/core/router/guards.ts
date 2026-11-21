import { toast } from "vue-sonner"
import type { RouteLocationNormalized, RouteLocationRaw, Router } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { ensureI18nBundles, translate } from "@/shared/i18n"
import { resolveI18nBundlesForPath } from "@/shared/i18n/bundles"
import { resolveSafeRedirectTarget } from "@/core/router/navigation"
import { clearLoginReason, isLoginReason, rememberLoginReason } from "@/modules/auth/lib/login-reason"
import {
    SECOND_FACTOR_RETURN_PARAM,
    decideSecondFactor,
    isSecondFactorAalQuery,
    loadSecondFactorGate,
    withoutSecondFactorReturnMarker,
} from "@/modules/auth/lib/session-assurance"
import { HOME_TOOL_URLS } from "@/modules/home/lib/home-trays"
import { recordToolVisit } from "@/modules/home/lib/tool-usage"

/**
 * The admin area needs a session that passed a second factor (the backend
 * refuses every admin request without one). Returns where to go instead, or
 * nothing when the page may open. See `session-assurance.ts`.
 */
async function resolveAdminSecondFactorRedirect(
    router: Router,
    to: RouteLocationNormalized
): Promise<RouteLocationRaw | undefined> {
    const returned = to.query[SECOND_FACTOR_RETURN_PARAM] === "1"
    const query = withoutSecondFactorReturnMarker(to.query)
    const decision = decideSecondFactor({
        gate: await loadSecondFactorGate(),
        returned,
        target: router.resolve({ path: to.path, query, hash: to.hash }).fullPath,
    })

    switch (decision.kind) {
        case "continue":
            return undefined
        case "strip-marker":
            return { path: to.path, query, hash: to.hash, replace: true }
        case "failed":
            toast.error(translate("core.auth.secondFactorIncompleteTitle"), {
                description: translate("core.auth.secondFactorIncompleteDescription"),
            })
            return "/"
        case "redirect":
            return decision.location
    }
}

export function setupRouteGuards(router: Router) {
    router.beforeEach(async (to) => {
        const userStore = useUserStore()
        userStore.checkExpiration()

        const hasKratosFlow = typeof to.query.flow === "string" && to.query.flow.trim() !== ""
        // A signed-in session stays on the sign-in page for its second factor:
        // while the flow is open, and when the page is asked to start one.
        const allowGuestRouteForStepUp = to.name === "user.login"
            && (hasKratosFlow || isSecondFactorAalQuery(to.query.aal))

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

        // After the role: a normal user is turned away as before and is never
        // asked for a second factor on the way.
        if (to.matched.some((record) => record.meta.requiresAdmin || record.meta.requiresSuperAdmin)) {
            return await resolveAdminSecondFactorRedirect(router, to)
        }

        // The return marker of a second-factor sign-in means nothing to a page
        // that does not need one: it only leaves the address.
        if (SECOND_FACTOR_RETURN_PARAM in to.query) {
            return { path: to.path, query: withoutSecondFactorReturnMarker(to.query), hash: to.hash, replace: true }
        }
    })

    // Feeds the home page's "frequently used" row; kept in this browser only.
    router.afterEach((to, _from, failure) => {
        if (!failure) {
            recordToolVisit(to.path, HOME_TOOL_URLS)
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
