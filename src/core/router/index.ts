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
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        }
        if (to.path === from.path && !to.hash) {
            // Query-only navigation (catalog filters, sort, page written with
            // router.replace) keeps the reader where they are; pages scroll to
            // their own results anchor when it matters.
            return false
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
