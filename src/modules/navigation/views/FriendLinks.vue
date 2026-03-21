<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFriendLinks } from "@/modules/navigation/composables/useFriendLinks"

const { friendLinks, loading } = useFriendLinks()
const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 px-0 py-4 space-y-6">
    <!-- Header intro -->
    <div class="space-y-2 max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight">{{ t("navigationPages.friendLinks.title") }}</h1>
      <p class="text-muted-foreground">
        {{ t("navigationPages.friendLinks.description") }}
      </p>
    </div>

    <!-- Friend link card grid -->
    <div v-if="loading" class="text-center py-10 text-muted-foreground">
      {{ t("navigationPages.friendLinks.loading") }}
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <a 
        v-for="friend in friendLinks" 
        :key="friend.id"
        :href="friend.url" 
        target="_blank" 
        rel="noopener noreferrer"
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
              <!-- Optional tag display -->
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
