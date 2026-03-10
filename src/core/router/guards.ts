import { toast } from "vue-sonner"
import type { Router } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { translate } from "@/shared/i18n"

export function setupRouteGuards(router: Router) {
    router.beforeEach((to) => {
        const userStore = useUserStore()
        userStore.checkExpiration()

        if (to.meta.guestOnly && userStore.isLoggedIn) {
            return "/"
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
