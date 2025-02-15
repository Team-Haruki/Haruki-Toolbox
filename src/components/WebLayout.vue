<template>
  <div class="flex h-screen">
    <!-- 侧边栏 -->
    <aside :class="['bg-base-200 p-4 flex flex-col transition-all duration-300', isSidebarCollapsed ? 'w-16' : 'w-64']">
      <!-- 网站 Logo、标题和折叠按钮 -->
      <div class="flex items-center justify-between mb-4">
        <img v-if="!isSidebarCollapsed" src="@/assets/haruki.ico" alt="Logo" class="w-10 h-10" />
        <span v-if="!isSidebarCollapsed" class="ml-2 text-lg font-semibold">Haruki工具箱</span>

        <!-- 折叠按钮（始终可见） -->
        <button class="btn btn-sm btn-square btn-outline" @click="toggleSidebar">
          <span v-if="isSidebarCollapsed">☰</span>
          <span v-else>✖</span>
        </button>
      </div>

      <!-- 侧边栏菜单 -->
      <nav>
        <ul class="menu">
          <li>
            <router-link to="/" class="flex items-center">
              <LucideHome class="w-5 h-5" />
              <span v-if="!isSidebarCollapsed" class="ml-2">首页</span>
            </router-link>
          </li>
          <li>
            <details>
              <summary class="flex items-center">
                <LucideNavigation class="w-5 h-5" />
                <span v-if="!isSidebarCollapsed" class="ml-2">导航</span>
              </summary>
              <ul>
                <li>
                  <router-link to="/navigation" class="flex items-center">
                    <LucideMap class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">导航</span>
                  </router-link>
                </li>
                <li>
                  <router-link to="/about" class="flex items-center">
                    <LucideInfo class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">关于</span>
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary class="flex items-center">
                <LucideWrench class="w-5 h-5" />
                <span v-if="!isSidebarCollapsed" class="ml-2">工具</span>
              </summary>
              <ul>
                <li>
                  <router-link to="/upload_suite" class="flex items-center">
                    <LucideUpload class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">上传Suite数据</span>
                  </router-link>
                </li>
                <li>
                  <router-link to="/upload_mysekai" class="flex items-center">
                    <LucideUploadCloud class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">上传MySekai数据</span>
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主要内容 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <header class="bg-cyan-950 text-white p-4 flex items-center shadow">
        <h1 class="text-xl font-bold">Haruki工具箱</h1>
        <span class="mx-2 text-gray-200">|</span>
        <span class="text-lg">{{ pageTitle }}</span>
      </header>

      <!-- 主内容 -->
      <main class="flex-1 p-6">
        <router-view />
      </main>

      <!-- 底部 -->
      <footer class="bg-base-200 p-4 text-center">
        &copy; 2025 Haruki Toolbox. All rights reserved.
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// 引入 lucide-vue-next 图标
import {
  LucideHome,
  LucideNavigation,
  LucideMap,
  LucideInfo,
  LucideWrench,
  LucideUpload,
  LucideUploadCloud
} from 'lucide-vue-next';

// 控制侧边栏是否折叠
const isSidebarCollapsed = ref(false);
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 计算当前页面标题
const route = useRoute();
const pageTitle = computed(() => route.meta.title || "主页");

watch(
    () => route.meta.title,
    (newTitle) => {
      document.title = newTitle ? `${newTitle} | Haruki 工具箱` : 'Haruki 工具箱';
    },
    { immediate: true }
);

// 确保页面加载时也设置标题
onMounted(() => {
  document.title = route.meta.title ? `${route.meta.title} | Haruki 工具箱` : 'Haruki 工具箱';
});

</script>
