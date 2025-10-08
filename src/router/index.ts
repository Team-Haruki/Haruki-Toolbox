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
                component: () => import("@/components/pages/navigations/FriendGroups.vue"),
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
                component: () => import("@/components/pages/tools/PointCalculator.vue"),
                meta: {title: '活动Pt计算器'}
            },
            {
                path: '/upload-data',
                component: () => import("@/components/pages/tools/UploadData.vue"),
                meta: {title: '上传数据'}
            },
            {
                path: '/ios-modules',
                component: () => import("@/components/pages/tools/IOSModules.vue"),
                meta: {title: 'iOS模块快速安装'}
            },
            {
                path: '/user',
                component: () => import('@/components/pages/users/UserLayout.vue'),
                children: [
                    {
                        path: 'login',
                        component: () => import('@/components/pages/users/Login.vue'),
                        meta: { title: '登录' }
                    },
                    {
                        path: 'register',
                        component: () => import('@/components/pages/users/Register.vue'),
                        meta: { title: '注册账号' }
                    },
                    {
                        path: 'settings',
                        component: () => import('@/components/pages/users/Settings.vue'),
                        meta: { title: '账号设置' }
                    },
                    {
                        path: 'game-account-bindings',
                        component: () => import('@/components/pages/users/GameAccountBinding.vue'),
                        meta: { title: '绑定游戏账号' }
                    },
                    {
                        path: 'reset-password/:verifyHash',
                        name: 'reset-password',
                        component: () => import('@/components/pages/users/ResetPassword.vue'),
                        props: route => ({
                            verifyHash: route.params.verifyHash,
                            email: route.query.email,
                        }),
                    },
                ]
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        console.debug(to, from, savedPosition);
        return {top: 0, behavior: 'smooth'};
    },
});

export default router;