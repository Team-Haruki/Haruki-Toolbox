import type { RouteRecordRaw } from "vue-router"

export const sekaiStationRoutes: RouteRecordRaw[] = [
  {
    path: "/sekai-station",
    component: () => import("@/modules/sekai-station/views/SekaiStation.vue"),
    meta: { titleKey: "route.sekaiStation" },
  },
]
