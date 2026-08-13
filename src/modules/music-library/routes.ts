import type { RouteRecordRaw } from "vue-router"

export const musicLibraryRoutes: RouteRecordRaw[] = [
    {
        path: "/music",
        name: "musicLibrary.list",
        component: () => import("@/modules/music-library/views/MusicList.vue"),
        meta: { titleKey: "route.musicLibrary.list" },
    },
    {
        // Must stay before the /music/:musicId catch-all so "progress" is not
        // captured as a musicId param.
        path: "/music/progress",
        name: "musicLibrary.progress",
        component: () => import("@/modules/music-library/views/MusicProgress.vue"),
        meta: { titleKey: "route.musicLibrary.progress", requiresAuth: true },
    },
    {
        path: "/music/:musicId",
        name: "musicLibrary.detail",
        component: () => import("@/modules/music-library/views/MusicDetail.vue"),
        meta: { titleKey: "route.musicLibrary.detail" },
        props: true,
    },
]
