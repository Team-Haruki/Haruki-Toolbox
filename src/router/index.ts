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
                path: '/pt_calc',
                redirect: '/pt-calculator'
            },
            {
                path: '/upload_suite',
                redirect: '/upload-data'
            },
            {
                path: '/upload_mysekai',
                redirect: '/upload-data'
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
            {
                path: '/user/login',
                component: () => import("@/components/users/pages/Login.vue"),
                meta: {title: '登录'}
            },
            {
                path: '/user/register',
                component: () => import("@/components/users/pages/Register.vue"),
                meta: {title: '注册账号'}
            },
            {
                path: '/user/settings',
                component: () => import("@/components/users/pages/Settings.vue"),
                meta: {title: '账号设置'}
            },
            {
                path: '/user/game-account-binding',
                component: () => import("@/components/users/pages/GameAccountBinding.vue"),
                meta: {title: '绑定游戏账号'}
            },
            {
                path: "/user/reset-password/:verifyHash",
                name: "reset-password",
                component: () => import("@/components/users/pages/ResetPassword.vue"),
                props: (route) => ({
                    verifyHash: route.params.verifyHash,
                    email: route.query.email,
                }),
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