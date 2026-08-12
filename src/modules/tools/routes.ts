import type { RouteRecordRaw } from "vue-router"
import { botNeoRoutes } from "@/modules/haruki-bot-neo/routes"

export const toolRoutes: RouteRecordRaw[] = [
    ...botNeoRoutes,
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
        // The iOS module generator merged into the upload-data page; external
        // tutorials still link here.
        path: "/ios-modules",
        redirect: { path: "/upload-data", query: { tab: "ios" } },
    },
]
