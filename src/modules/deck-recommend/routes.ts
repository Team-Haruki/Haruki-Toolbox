import type { RouteRecordRaw } from "vue-router"

export const deckRecommendRoutes: RouteRecordRaw[] = [
  {
    path: "/deck-recommend",
    name: "deckRecommend",
    component: () => import("@/modules/deck-recommend/views/DeckRecommend.vue"),
    meta: { titleKey: "route.deckRecommend", requiresAuth: true },
  },
]
