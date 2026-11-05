import type { RouteRecordRaw } from "vue-router"
import { botNeoRoutes } from "@/modules/haruki-bot-neo/routes"

export const toolRoutes: RouteRecordRaw[] = [
    ...botNeoRoutes,
    {
        path: "/pt_calc",
        redirect: "/pt-calculator",
    },
    // The old per-type upload pages were the manual file upload; land on that
    // tab with the matching data type preselected, not on the iOS default.
    {
        path: "/upload_suite",
        redirect: { path: "/upload-data", query: { tab: "file", type: "suite" } },
    },
    {
        path: "/upload_mysekai",
        redirect: { path: "/upload-data", query: { tab: "file", type: "mysekai" } },
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
