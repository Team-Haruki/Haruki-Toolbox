import { createRouter, createWebHistory } from "vue-router"
import { webRoutes } from "@/modules/web/routes"
import { setupRouteGuards } from "@/core/router/guards"
import { recordScrollMemoryArrival } from "@/core/router/scroll-memory"

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        titleKey?: string
        requiresAuth?: boolean
        requiresAdmin?: boolean
        requiresSuperAdmin?: boolean
        guestOnly?: boolean
        /**
         * The page restores its own scroll position once its data has
         * rendered (see useCatalogScrollMemory); the router must not scroll.
         */
        scrollMemory?: boolean
    }
}

const router = createRouter({
    history: createWebHistory(),
    routes: webRoutes,
    scrollBehavior(to, from, savedPosition) {
        if (to.meta.scrollMemory && to.path !== from.path && !to.hash) {
            // Restoring onto a not-yet-rendered list lands on a skeleton that
            // is shorter than the final content; the page restores itself.
            recordScrollMemoryArrival(savedPosition != null)
            return savedPosition ? false : { top: 0 }
        }
        if (savedPosition) {
            return savedPosition
        }
        if (to.meta.scrollMemory && to.path === from.path && !to.hash) {
            // Query-only navigation on catalog lists (filters, sort, page
            // written with router.replace) keeps the reader where they are;
            // the list scrolls to its own results anchor when it matters.
            // Other pages keep the historical scroll-to-top behaviour.
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
