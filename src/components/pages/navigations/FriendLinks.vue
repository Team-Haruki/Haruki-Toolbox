<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiClient } from '@/api/call-api'

export interface FriendLinkItem {
  id: number
  name: string
  description: string
  avatar: string
  url: string
  tags: string[]
}

const friendLinks = ref<FriendLinkItem[]>([])
const loading = ref(true)

async function fetchFriendLinks() {
  try {
    const response = await apiClient.get('/misc/friend_links')
    friendLinks.value = response.data?.updatedData ?? response.data ?? []
  } catch (error) {
    console.error('Failed to fetch friend links:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFriendLinks()
})
</script>

<template>
  <div class="w-full flex-1 p-6 space-y-6">
    <!-- 头部介绍区 -->
    <div class="space-y-2 max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight">友情链接</h1>
      <p class="text-muted-foreground">
        一些与Haruki项目友好的网站推荐
      </p>
    </div>

    <!-- 友链卡片网格 -->
    <div v-if="loading" class="text-center py-10 text-muted-foreground">
      载入中...
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <a 
        v-for="friend in friendLinks" 
        :key="friend.id"
        :href="friend.url" 
        target="_blank" 
        class="block group outline-none"
      >
        <Card class="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer bg-card/50 backdrop-blur-sm">
          <CardHeader class="flex flex-row items-center gap-4 pb-2">
            
            <Avatar class="h-12 w-12 border-2 border-transparent transition-colors duration-300 group-hover:border-primary">
              <AvatarImage :src="friend.avatar" :alt="friend.name" />
              <AvatarFallback>{{ friend.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            
            <div class="flex flex-col">
              <CardTitle class="text-lg group-hover:text-primary transition-colors">
                {{ friend.name }}
              </CardTitle>
              <!-- 简单的标签展示 (可选) -->
              <div class="flex gap-1 mt-1">
                <span 
                  v-for="tag in friend.tags" 
                  :key="tag"
                  class="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-secondary-foreground"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            
          </CardHeader>

          <CardContent>
            <CardDescription class="line-clamp-2 leading-relaxed">
              {{ friend.description }}
            </CardDescription>
          </CardContent>
        </Card>
      </a>
    </div>
  </div>
</template>
