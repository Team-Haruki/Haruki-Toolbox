import type { RouteRecordRaw } from "vue-router"

export const toolRoutes: RouteRecordRaw[] = [
    {
        path: "/pt_calc",
        redirect: "/pt-calculator",
    },
    {
        path: "/upload_suite",
        redirect: "/upload-data",
    },
    {
        path: "/upload_mysekai",
        redirect: "/upload-data",
    },
    {
        path: "/pt-calculator",
        component: () => import("@/modules/tools/views/PointCalculator.vue"),
        meta: { titleKey: "route.ptCalculator" },
    },
    {
        path: "/upload-data",
        component: () => import("@/modules/tools/views/UploadData.vue"),
        meta: { titleKey: "route.uploadData" },
    },
    {
        path: "/ios-modules",
        component: () => import("@/modules/tools/views/IOSModules.vue"),
        meta: { titleKey: "route.iosModules" },
    },
]
