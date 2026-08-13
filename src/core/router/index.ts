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
    scrollBehavior(to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        if (to.hash) {
            // The routed view mounts behind a 150ms page-fade transition, so
            // the anchor target doesn't exist yet when this hook runs. The
            // top offset matches the anchors' scroll-mt-24.
            return new Promise((resolve) => {
                window.setTimeout(() => resolve({ el: to.hash, top: 96, behavior: "smooth" }), 250)
            })
        }
        return { top: 0, behavior: "smooth" }
    },
})

setupRouteGuards(router)

export default router;
