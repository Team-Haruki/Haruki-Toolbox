import type { RouteRecordRaw } from "vue-router"

export const adminSponsorRoutes: RouteRecordRaw[] = [
  {
    path: "sponsors",
    name: "admin.sponsors",
    component: () => import("@/modules/admin-sponsors/views/AdminSponsorManagement.vue"),
    meta: { titleKey: "route.admin.sponsors", requiresAdmin: true },
  },
]
