import type { RouteRecordRaw } from "vue-router"

export const musicLibraryRoutes: RouteRecordRaw[] = [
    {
        path: "/music",
        name: "musicLibrary.list",
        component: () => import("@/modules/music-library/views/MusicList.vue"),
        meta: { titleKey: "route.musicLibrary.list" },
    },
    {
        path: "/music/:musicId",
        name: "musicLibrary.detail",
        component: () => import("@/modules/music-library/views/MusicDetail.vue"),
        meta: { titleKey: "route.musicLibrary.detail" },
        props: true,
    },
]
