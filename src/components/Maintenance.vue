<template>
  <div class="flex flex-col items-center justify-center h-full w-full flex-1 text-center bg-base-100 p-6 rounded-lg shadow-lg">
    <LucideAlertCircle class="w-16 h-16 text-yellow-500" />
    <h2 class="text-3xl font-bold mt-4">页面施工中</h2>
    <p class="text-gray-500 mt-2 text-lg">{{ message }}</p>
    <p v-if="maintenanceEnd" class="text-gray-400 text-sm mt-4">
      预计维护结束时间：{{ maintenanceEnd }}
    </p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { LucideAlertCircle } from 'lucide-vue-next';

defineProps({
  message: {
    type: String,
    default: "该页面正在开发中，请等待 Haruki Dev Team 开发完成。",
  },
  maintenanceEnd: {
    type: String,
    default: null,
  }
});
</script>