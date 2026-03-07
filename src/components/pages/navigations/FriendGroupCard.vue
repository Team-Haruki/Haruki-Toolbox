<script setup lang="ts">
import {Card} from '@/components/ui/card'

import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui/avatar'

export interface FriendGroupItem {
  name: string
  avatar: string
  bg: string
  groupInfo: string
  detail: string
  url?: string
}

const props = defineProps<{
  item: FriendGroupItem
}>()

</script>

<template>
  <!-- 使用 div 包裹，取消点击跳转 -->
  <div class="block group outline-none">
    <Card
      class="relative w-full overflow-hidden select-none rounded-xl border border-border/50 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-primary/50 p-0"
    >
      <!-- 使用 padding-bottom Hack 确保绝对的 3:2 比例 (2/3 = 66.666%) -->
      <div class="relative w-full h-0 pb-[66.666%] bg-muted">
        <!-- 动态背景图带微缩放动画 -->
        <template v-if="item.bg">
          <img
            :src="item.bg"
            alt=""
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </template>
        
        <!-- 底部渐变引导区，常驻 -->
        <div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"></div>

        <!-- 内容信息区：采用下沉布局 -->
        <div class="absolute inset-0 p-4 flex flex-col justify-end">
          
          <div class="flex items-center gap-3 relative z-10 transition-transform duration-300 ease-out group-hover:-translate-y-1">
            <Avatar class="w-12 h-12 border-2 border-white/20 shadow-sm transition-colors duration-300 group-hover:border-primary">
              <AvatarImage :src="item.avatar" />
              <AvatarFallback>{{ item.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold text-lg truncate drop-shadow-md">{{ item.name }}</div>
              <div class="text-white/80 text-xs truncate drop-shadow-sm">{{ item.groupInfo }}</div>
            </div>
          </div>
          
          <!-- 详细描述：隐藏状态，Hover时滑出并淡入 -->
          <div 
            class="overflow-hidden transition-all duration-300 ease-in-out max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2"
          >
            <p class="text-sm text-white/95 line-clamp-3 leading-snug drop-shadow-md">
              {{ item.detail }}
            </p>
          </div>
          
        </div>
      </div>
    </Card>
  </div>
</template>