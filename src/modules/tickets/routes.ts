import type { RouteRecordRaw } from "vue-router"

export const userTicketRoutes: RouteRecordRaw[] = [
    {
        path: "/tickets",
        component: () => import("@/modules/tickets/views/TicketList.vue"),
        meta: { titleKey: "route.tickets.mine", requiresAuth: true },
    },
    {
        path: "/tickets/new",
        component: () => import("@/modules/tickets/views/TicketCreate.vue"),
        meta: { titleKey: "route.tickets.create", requiresAuth: true },
    },
    {
        path: "/tickets/:ticketId",
        component: () => import("@/modules/tickets/views/TicketDetail.vue"),
        meta: { titleKey: "route.tickets.detail", requiresAuth: true },
        props: true,
    },
]

export const adminTicketRoutes: RouteRecordRaw[] = [
    {
        path: "tickets",
        component: () => import("@/modules/tickets/views/admin/AdminTicketList.vue"),
        meta: { titleKey: "route.admin.tickets", requiresAdmin: true },
    },
    {
        path: "tickets/:ticketId",
        component: () => import("@/modules/tickets/views/admin/AdminTicketDetail.vue"),
        meta: { titleKey: "route.tickets.detail", requiresAdmin: true },
        props: true,
    },
]
