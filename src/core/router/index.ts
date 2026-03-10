import { createRouter, createWebHistory } from "vue-router"
import { webRoutes } from "@/modules/web/routes"
import { setupRouteGuards } from "@/core/router/guards"

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        titleKey?: string
        requiresAuth?: boolean
        requiresAdmin?: boolean
        requiresSuperAdmin?: boolean
        guestOnly?: boolean
    }
}

const router = createRouter({
    history: createWebHistory(),
    routes: webRoutes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        return { top: 0, behavior: "smooth" }
    },
})

setupRouteGuards(router)

export default router;
