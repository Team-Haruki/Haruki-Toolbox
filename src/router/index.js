import { createRouter, createWebHistory } from 'vue-router';
import WebLayout from '@/components/WebLayout.vue';

const routes = [
    {
        path: '/',
        component: WebLayout,
        children: [
            { path: '', component: () => import('@/components/Home.vue'), meta: { title: '主页' } },
            { path: 'navigation', component: () => import('@/components/pages/Navigation.vue'), meta: { title: '导航' } },
            { path: 'about', component: () => import('@/components/pages/About.vue'), meta: { title: '关于' } },
            { path: 'upload_suite', component: () => import('@/components/pages/UploadMySekai.vue'), meta: { title: '上传Suite数据' } },
            { path: 'upload_mysekai', component: () => import('@/components/pages/UploadMySekai.vue'), meta: { title: '上传MySekai数据' } },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
