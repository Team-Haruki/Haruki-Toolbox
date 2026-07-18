import type { RouteRecordRaw } from "vue-router"
import { homeRoutes } from "@/modules/home/routes"
import { navigationRoutes } from "@/modules/navigation/routes"
import { sponsorRoutes } from "@/modules/sponsor/routes"
import { deckRecommendRoutes } from "@/modules/deck-recommend/routes"
import { rankBorderRoutes } from "@/modules/rank-border/routes"
import { musicLibraryRoutes } from "@/modules/music-library/routes"
import { cardsRoutes } from "@/modules/cards/routes"
import { eventsRoutes } from "@/modules/events/routes"
import { clientConfigGeneratorRoutes } from "@/modules/client-config-generator/routes"
import { toolRoutes } from "@/modules/tools/routes"
import { userRoutes } from "@/modules/user/routes"
import { userTicketRoutes } from "@/modules/tickets/routes"
import { adminRoutes } from "@/modules/admin/routes"

export const webChildRoutes: RouteRecordRaw[] = [
    ...homeRoutes,
    ...navigationRoutes,
    ...sponsorRoutes,
    ...deckRecommendRoutes,
    ...rankBorderRoutes,
    ...musicLibraryRoutes,
    ...cardsRoutes,
    ...eventsRoutes,
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
