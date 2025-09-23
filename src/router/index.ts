import {createRouter, createWebHistory} from 'vue-router';

const routes = [
    {
        path: '/',
        component: () => import("@/components/WebLayout.vue"),
        children: [
            {
                path: '',
                component: () => import("@/components/pages/Home.vue"),
                meta: {title: '主页'}
            },
            {
                path: '/about',
                component: () => import("@/components/Maintenance.vue"),
                meta: {title: '关于'}
            },
            {
                path: '/friend-groups',
                component: () => import("@/components/navigations/FriendGroups.vue"),
                meta: {title: '推荐群聊'}
            },
            {
                path: '/friend-links',
                component: () => import("@/components/Maintenance.vue"),
                meta: {title: '友情链接'}
            },
            {
                path: '/pt-calculator',
                component: () => import("@/components/pages/haruki_bot/PointCalculator.vue"),
                meta: {title: '活动Pt计算器'}
            },
            {
                path: '/upload-data',
                component: () => import("@/components/pages/haruki_bot/UploadData.vue"),
                meta: {title: '上传数据'}
            },
            {
                path: '/ios-modules',
                component: () => import("@/components/pages/haruki_bot/IOSModules.vue"),
                meta: {title: 'iOS模块快速安装'}
            },
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        console.log(to, from, savedPosition);
        return {top: 0, behavior: 'smooth'};
    },
});

export default router;