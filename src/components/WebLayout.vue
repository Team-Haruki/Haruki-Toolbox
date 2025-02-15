<template>
  <div class="flex h-screen">
    <!-- 侧边栏 -->
    <aside
        :class="[
        'bg-base-200 p-4 flex flex-col transition-all duration-300 ease-in-out',
        isMobile
          ? (isSidebarCollapsed ? 'absolute left-[-100%] top-0 w-64 h-full z-50 shadow-lg' : 'absolute left-0 top-0 w-64 h-full z-50 shadow-lg')
          : (isSidebarCollapsed ? 'w-20' : 'w-64')
      ]"
    >
      <!-- 网站 Logo、标题和折叠按钮 -->
      <div class="flex items-center justify-between mb-4">
        <img v-if="!isSidebarCollapsed" src="@/assets/haruki.ico" alt="Logo" class="w-10 h-10" />
        <span v-if="!isSidebarCollapsed" class="ml-2 text-lg font-semibold">Haruki工具箱</span>

        <!-- 折叠/展开按钮（移动端始终可见） -->
        <button class="btn btn-sm btn-square btn-outline" @click="toggleSidebar">
          <span v-if="isSidebarCollapsed"><LucideMenu class="w-4 h-4" /></span>
          <span v-else><LucideArrowLeftToLine class="w-4 h-4" /></span>
        </button>
      </div>

      <!-- 侧边栏菜单 -->
      <nav>
        <ul class="menu w-full" :class="{
          'p-0': isSidebarCollapsed
        }">
          <li>
            <router-link to="/" :class="{
              'ps-2  pe-2 w-fit': isSidebarCollapsed
            }">
              <LucideHome class="w-5 h-5" />
              <span v-if="!isSidebarCollapsed" class="ml-2">首页</span>
            </router-link>
          </li>
          <li>
            <details>
              <summary :class="{
                'ps-2  pe-2 w-fit': isSidebarCollapsed
              }">
                <LucideNavigation class="w-5 h-5" />
                <span v-if="!isSidebarCollapsed" class="ml-2">导航</span>
              </summary>
              <ul>
                <li>
                  <router-link to="/navigation" :class="{
                    'ps-2  pe-2 w-fit': isSidebarCollapsed
                  }">
                    <LucideMap class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">导航</span>
                  </router-link>
                </li>
                <li>
                  <router-link to="/about" :class="{
                    'ps-2  pe-2 w-fit': isSidebarCollapsed
                  }">
                    <LucideInfo class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">关于</span>
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary :class="{
                'ps-2  pe-2 w-fit': isSidebarCollapsed
              }">
                <LucideWrench class="w-5 h-5" />
                <span v-if="!isSidebarCollapsed" class="ml-2">工具</span>
              </summary>
              <ul>
                <li>
                  <router-link to="/upload_suite" :class="{
                    'ps-2  pe-2 w-fit': isSidebarCollapsed
                  }">
                    <LucideUpload class="w-5 h-5" />
                    <span v-if="!isSidebarCollapsed" class="ml-2">上传Suite数据</span>
                  </router-link>
                </li>
                <li>
                  <router-link to="/upload_mysekai" :class="{
                    'ps-2  pe-2 w-fit': isSidebarCollapsed
                  }">
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

    <!-- 背景遮罩（移动端显示侧边栏时生效） -->
    <div
        v-if="isMobile && !isSidebarCollapsed"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        @click="isSidebarCollapsed = true"
    ></div>

    <!-- 主要内容 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部栏（移动端显示展开按钮） -->
      <header class="bg-cyan-950 text-white p-4 flex items-center shadow relative">
        <button v-if="isMobile" class="btn btn-sm btn-square btn-outline mr-2" @click="toggleSidebar">
          ☰
        </button>
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
  LucideUploadCloud,
  LucideMenu,
  LucideArrowLeftToLine
} from 'lucide-vue-next';

// 控制侧边栏是否折叠
const isSidebarCollapsed = ref(true);
const isMobile = ref(window.innerWidth <= 768);

// 监听窗口变化，自动调整 `isMobile`
const updateMobileView = () => {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value) {
    isSidebarCollapsed.value = true; // 在移动端默认隐藏侧边栏
  }
};

// 监听页面尺寸变化
window.addEventListener('resize', updateMobileView);

// 侧边栏切换
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 计算当前页面标题
const route = useRoute();
const pageTitle = computed(() => route.meta.title || "主页");

// 监听 `meta.title` 变化，更新网页标题
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
