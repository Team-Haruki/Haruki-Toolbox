<template>
  <div class="flex h-screen">
    <!-- 侧边栏 -->
    <aside :class="['bg-base-200 p-4 flex flex-col transition-all', isSidebarCollapsed ? 'w-16' : 'w-64']">
      <!-- 折叠按钮 -->
      <button class="btn btn-sm btn-square btn-outline mb-4" @click="toggleSidebar">
        <span v-if="isSidebarCollapsed">☰</span>
        <span v-else>✖</span>
      </button>

      <!-- 侧边栏菜单 -->
      <nav>
        <ul class="menu">
          <li>
            <details open>
              <summary>分类 1</summary>
              <ul>
                <li><router-link to="/tool1">工具 1</router-link></li>
                <li><router-link to="/tool2">工具 2</router-link></li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary>分类 2</summary>
              <ul>
                <li><router-link to="/tool3">工具 3</router-link></li>
                <li><router-link to="/tool4">工具 4</router-link></li>
              </ul>
            </details>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主要内容 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部栏 -->
      <header class="bg-base-100 shadow p-4 flex items-center">
        <h1 class="text-xl font-bold">工具箱</h1>
        <span class="mx-2 text-gray-400">/</span>
        <span class="text-lg">{{ pageTitle }}</span>
      </header>

      <!-- 主内容 -->
      <main class="flex-1 p-6">
        <router-view />
      </main>

      <!-- 底部 -->
      <footer class="bg-base-200 p-4 text-center">
        &copy; 2025 工具箱网站
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

// 控制侧边栏是否折叠
const isSidebarCollapsed = ref(false);
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 计算当前页面标题
const route = useRoute();
const pageTitle = computed(() => route.meta.title || "工具箱");
</script>
