import type { RouteRecordRaw } from "vue-router"

export const sponsorRoutes: RouteRecordRaw[] = [
  {
    path: "/sponsors",
    name: "sponsors",
    component: () => import("@/modules/sponsor/views/Sponsors.vue"),
    meta: { titleKey: "route.sponsors" },
  },
]
