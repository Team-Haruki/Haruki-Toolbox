import type { RouteRecordRaw } from "vue-router"

export const cardsRoutes: RouteRecordRaw[] = [
    {
        path: "/cards",
        name: "cards.list",
        component: () => import("@/modules/cards/views/CardList.vue"),
        meta: { titleKey: "route.cards.list" },
    },
    {
        path: "/cards/:cardId",
        name: "cards.detail",
        component: () => import("@/modules/cards/views/CardDetail.vue"),
        meta: { titleKey: "route.cards.detail" },
        props: true,
    },
]
