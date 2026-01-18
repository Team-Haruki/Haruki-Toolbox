<script setup lang="ts">
import {onMounted} from 'vue'
import {Card} from '@/components/ui/card'
import {AspectRatio} from '@/components/ui/aspect-ratio'

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
  active: boolean
  idx: number
}>()

const emit = defineEmits(['activate', 'deactivate'])

let isMobile = false

function detectMobile() {
  isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

function handleClick() {
  emit('activate', props.idx)
}

function handleMouseEnter() {
  if (!isMobile) emit('activate', props.idx)
}

function handleMouseLeave() {
  if (!isMobile) emit('deactivate')
}

onMounted(detectMobile)
</script>

<template>
  <Card
      class="relative w-full shadow-xl overflow-hidden cursor-pointer select-none p-0"
      :class="{ 'ring-2 ring-accent': active }"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      tabindex="0"
  >
    <AspectRatio :ratio="3/2">
      <img
          v-if="item.bg"
          :src="item.bg"
          alt=""
          class="w-full h-full object-cover"
      />
      <div class="absolute bottom-0 left-0 w-full p-2 flex items-center bg-black/60">
        <Avatar class="w-10 h-10 border-2 border-white">
          <AvatarImage :src="item.avatar"/>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div class="flex-1 ml-2">
          <div class="text-white font-bold text-base">{{ item.name }}</div>
          <div class="text-gray-300 text-xs">{{ item.groupInfo }}</div>
        </div>
      </div>
      <div
          v-if="active"
          class="absolute inset-0 px-4 py-3 bg-white/80 flex items-center justify-center"
          style="backdrop-filter: blur(4px);"
      >
        <div class="text-black text-sm text-center">{{ item.detail }}</div>
      </div>
    </AspectRatio>
  </Card>
</template>