import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css'; // 确保 Tailwind CSS 样式生效

createApp(App).use(router).mount('#app');
