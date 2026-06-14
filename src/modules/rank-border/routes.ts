import type { RouteRecordRaw } from "vue-router"

export const rankBorderRoutes: RouteRecordRaw[] = [
  {
    path: "/rank-border",
    component: () => import("@/modules/rank-border/views/RankBorder.vue"),
    meta: { titleKey: "route.rankBorder" },
  },
]
