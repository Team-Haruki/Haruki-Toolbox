import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { useUserStore } from '@/store';
import { toast } from 'vue-sonner';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        requiresAdmin?: boolean
        requiresSuperAdmin?: boolean
    }
}

const routes = [
    {
        path: '/',
        component: () => import("@/components/WebLayout.vue"),
        children: [
            {
                path: '',
                component: () => import("@/components/pages/Home.vue"),
                meta: { title: '主页' }
            },
            {
                path: '/about',
                component: () => import("@/components/Maintenance.vue"),
                meta: { title: '关于' }
            },
            {
                path: '/friend-groups',
                component: () => import("@/components/pages/navigations/FriendGroups.vue"),
                meta: { title: '推荐群聊' }
            },
            {
                path: '/friend-links',
                component: () => import("@/components/pages/navigations/FriendLinks.vue"),
                meta: { title: '友情链接' }
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
                meta: { title: '活动Pt计算器' }
            },
            {
                path: '/upload-data',
                component: () => import("@/components/pages/tools/UploadData.vue"),
                meta: { title: '上传数据' }
            },
            {
                path: '/ios-modules',
                component: () => import("@/components/pages/tools/IOSModules.vue"),
                meta: { title: 'iOS模块生成器' }
            },
            {
                path: '/settings',
                component: () => import("@/components/pages/Settings.vue"),
                meta: { title: '设置' }
            },
            {
                path: '/oauth2/consent',
                component: () => import('@/components/pages/users/OAuthConsent.vue'),
                meta: { title: '授权第三方应用' }
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
                        meta: { title: '重置密码' },
                        props: (route: RouteLocationNormalized) => ({
                            verifyHash: route.params.verifyHash,
                            email: route.query.email,
                        }),
                    },
                ]
            },

            // ===== 工单系统（用户侧） =====
            {
                path: '/tickets',
                component: () => import('@/components/pages/tickets/TicketList.vue'),
                meta: { title: '我的工单' }
            },
            {
                path: '/tickets/new',
                component: () => import('@/components/pages/tickets/TicketCreate.vue'),
                meta: { title: '创建工单' }
            },
            {
                path: '/tickets/:ticketId',
                component: () => import('@/components/pages/tickets/TicketDetail.vue'),
                meta: { title: '工单详情' },
                props: true,
            },

            // ===== 管理后台 =====
            {
                path: '/admin',
                component: () => import('@/components/pages/admin/AdminLayout.vue'),
                meta: { title: '管理后台', requiresAdmin: true },
                children: [
                    {
                        path: '',
                        redirect: '/admin/dashboard',
                    },
                    {
                        path: 'dashboard',
                        component: () => import('@/components/pages/admin/Dashboard.vue'),
                        meta: { title: '仪表盘', requiresAdmin: true },
                    },
                    {
                        path: 'users',
                        component: () => import('@/components/pages/admin/UserManagement.vue'),
                        meta: { title: '用户管理', requiresAdmin: true },
                    },
                    {
                        path: 'users/:userId',
                        component: () => import('@/components/pages/admin/UserDetail.vue'),
                        meta: { title: '用户详情', requiresAdmin: true },
                        props: true,
                    },
                    {
                        path: 'oauth-clients',
                        component: () => import('@/components/pages/admin/OAuthClientManagement.vue'),
                        meta: { title: 'OAuth客户端管理', requiresAdmin: true },
                    },
                    {
                        path: 'logs',
                        component: () => import('@/components/pages/admin/SystemLogs.vue'),
                        meta: { title: '系统日志', requiresAdmin: true },
                    },
                    {
                        path: 'upload-logs',
                        component: () => import('@/components/pages/admin/UploadLogs.vue'),
                        meta: { title: '上传日志', requiresAdmin: true },
                    },
                    {
                        path: 'content',
                        component: () => import('@/components/pages/admin/ContentManagement.vue'),
                        meta: { title: '内容运营', requiresAdmin: true },
                    },
                    {
                        path: 'config',
                        component: () => import('@/components/pages/admin/SystemConfig.vue'),
                        meta: { title: '系统配置', requiresAdmin: true, requiresSuperAdmin: true },
                    },
                    {
                        path: 'game-bindings',
                        component: () => import('@/components/pages/admin/GameAccountBindings.vue'),
                        meta: { title: '游戏绑定管理', requiresAdmin: true },
                    },
                    {
                        path: 'sessions',
                        component: () => import('@/components/pages/admin/AdminSessions.vue'),
                        meta: { title: '会话管理', requiresAdmin: true },
                    },
                    {
                        path: 'risk',
                        component: () => import('@/components/pages/admin/RiskManagement.vue'),
                        meta: { title: '风控管理', requiresAdmin: true },
                    },
                    {
                        path: 'tickets',
                        component: () => import('@/components/pages/admin/tickets/AdminTicketList.vue'),
                        meta: { title: '工单管理', requiresAdmin: true },
                    },
                    {
                        path: 'tickets/:ticketId',
                        component: () => import('@/components/pages/admin/tickets/AdminTicketDetail.vue'),
                        meta: { title: '工单详情', requiresAdmin: true },
                        props: true,
                    },
                ]
            },
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(_to, _from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }
        return { top: 0, behavior: 'smooth' };
    },
});

// 权限守卫
router.beforeEach((to) => {
    const userStore = useUserStore()

    if (to.meta.requiresSuperAdmin && !userStore.isSuperAdmin) {
        toast.error("权限不足", { description: "需要超级管理员权限" })
        return '/'
    }

    if (to.meta.requiresAdmin && !userStore.isAdmin) {
        toast.error("权限不足", { description: "需要管理员权限" })
        return '/'
    }
})

export default router;