import type { RouteRecordRaw } from "vue-router"

export const eventsRoutes: RouteRecordRaw[] = [
    {
        path: "/events",
        name: "events.list",
        component: () => import("@/modules/events/views/EventList.vue"),
        meta: { titleKey: "route.events.list" },
    },
    {
        path: "/events/records",
        name: "events.records",
        component: () => import("@/modules/events/views/EventRecords.vue"),
        meta: { titleKey: "route.events.records", requiresAuth: true },
    },
    {
        path: "/events/:eventId",
        name: "events.detail",
        component: () => import("@/modules/events/views/EventDetail.vue"),
        meta: { titleKey: "route.events.detail" },
        props: true,
    },
]
