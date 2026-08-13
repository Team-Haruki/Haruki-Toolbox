import type { RouteRecordRaw } from "vue-router"

export const deckRecommendRoutes: RouteRecordRaw[] = [
  {
    path: "/deck-recommend",
    name: "deckRecommend",
    component: () => import("@/modules/deck-recommend/views/DeckRecommend.vue"),
    meta: { titleKey: "route.deckRecommend", requiresAuth: true },
  },
  {
    path: "/event-planner",
    name: "deckRecommend.eventPlanner",
    component: () => import("@/modules/deck-recommend/views/EventPlanner.vue"),
    meta: { titleKey: "route.eventPlanner.planner", requiresAuth: true },
  },
]
