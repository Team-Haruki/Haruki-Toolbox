import type { RouteRecordRaw } from "vue-router"

export const trainingRoutes: RouteRecordRaw[] = [
    {
        path: "/training",
        component: () => import("@/modules/training/views/TrainingLayout.vue"),
        meta: { requiresAuth: true },
        redirect: { name: "training.challenge" },
        children: [
            {
                path: "challenge",
                name: "training.challenge",
                component: () => import("@/modules/training/views/TrainingChallenge.vue"),
                meta: { titleKey: "route.training.challenge" },
            },
            {
                path: "power",
                name: "training.power",
                component: () => import("@/modules/training/views/TrainingPower.vue"),
                meta: { titleKey: "route.training.power" },
            },
            {
                path: "area",
                name: "training.area",
                component: () => import("@/modules/training/views/TrainingArea.vue"),
                meta: { titleKey: "route.training.area" },
            },
            {
                path: "bonds",
                name: "training.bonds",
                component: () => import("@/modules/training/views/TrainingBonds.vue"),
                meta: { titleKey: "route.training.bonds" },
            },
            {
                path: "leader",
                name: "training.leader",
                component: () => import("@/modules/training/views/TrainingLeader.vue"),
                meta: { titleKey: "route.training.leader" },
            },
            {
                path: "missions",
                name: "training.missions",
                component: () => import("@/modules/training/views/TrainingMissions.vue"),
                meta: { titleKey: "route.training.missions" },
            },
        ],
    },
]
