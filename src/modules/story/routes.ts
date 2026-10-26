import type { RouteRecordRaw } from "vue-router"

export const storyRoutes: RouteRecordRaw[] = [
    {
        path: "/story",
        name: "story.player",
        component: () => import("@/modules/story/views/StoryPlayer.vue"),
        meta: { titleKey: "route.story.player" },
    },
]
