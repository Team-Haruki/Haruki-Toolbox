import { toast } from "vue-sonner"
import type { Router } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { translate } from "@/shared/i18n"
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
            if (to.path !== "/user/login") {
                toast.error(translate("core.auth.loginRequiredTitle"), {
                    description: translate("core.auth.loginRequiredDescription"),
                })
            }
            return {
                path: "/user/login",
                query: { redirect: to.fullPath },
            }
        }

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
}
