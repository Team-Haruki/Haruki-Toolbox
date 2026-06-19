import type { RouteRecordRaw } from "vue-router"
import { homeRoutes } from "@/modules/home/routes"
import { navigationRoutes } from "@/modules/navigation/routes"
import { deckRecommendRoutes } from "@/modules/deck-recommend/routes"
import { rankBorderRoutes } from "@/modules/rank-border/routes"
import { clientConfigGeneratorRoutes } from "@/modules/client-config-generator/routes"
import { toolRoutes } from "@/modules/tools/routes"
import { userRoutes } from "@/modules/user/routes"
import { userTicketRoutes } from "@/modules/tickets/routes"
import { adminRoutes } from "@/modules/admin/routes"

export const webChildRoutes: RouteRecordRaw[] = [
    ...homeRoutes,
    ...navigationRoutes,
    ...deckRecommendRoutes,
    ...rankBorderRoutes,
    ...clientConfigGeneratorRoutes,
    ...toolRoutes,
    ...userRoutes,
    ...userTicketRoutes,
    ...adminRoutes,
]

export const webRoutes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("@/modules/web/views/WebLayout.vue"),
        children: webChildRoutes,
    },
]
