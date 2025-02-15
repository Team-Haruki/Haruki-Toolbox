import { createRouter, createWebHistory } from 'vue-router';
import Layout from '@/components/Layout.vue';

const routes = [
    {
        path: '/',
        component: Layout,
        children: [
            { path: 'tool1', component: () => import('@/pages/Tool1.vue'), meta: { title: '工具 1' } },
            { path: 'tool2', component: () => import('@/pages/Tool2.vue'), meta: { title: '工具 2' } },
            { path: 'tool3', component: () => import('@/pages/Tool3.vue'), meta: { title: '工具 3' } },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
