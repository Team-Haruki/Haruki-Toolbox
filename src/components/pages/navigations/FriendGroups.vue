<script setup lang="ts">
import { apiClient } from '@/api/call-api'
import FriendGroupCard, { type FriendGroupItem } from "@/components/pages/navigations/FriendGroupCard.vue"

import {
  ref,
  onMounted
} from 'vue'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion"

interface FriendGroupData {
  group: string
  groupList: FriendGroupItem[]
}

const groupData = ref<FriendGroupData[]>([])
const openGroups = ref<string[]>([])

async function fetchGroupData() {
  try {
    const response = await apiClient.get('/misc/friend_groups')
    const rawData: FriendGroupData[] = response.data?.updatedData ?? response.data ?? []
    const data = rawData.filter(g => g.groupList && g.groupList.length > 0)
    groupData.value = data
    openGroups.value = data.map((g) => g.group)
  } catch (error) {
    console.error('Failed to fetch group data:', error)
  }
}



onMounted(() => {
  fetchGroupData()
})
</script>

<template>
  <div class="w-full flex-1 px-0 py-4 space-y-6">
    <!-- 头部介绍区 -->
    <div class="space-y-2 max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight">推荐群聊</h1>
      <p class="text-muted-foreground">
        一些与pjsk相关的群聊推荐
      </p>
    </div>

    <Accordion
        v-model="openGroups"
        type="multiple"
        class="w-full max-w-5xl mx-auto"
        collapsible
    >
      <AccordionItem
          v-for="group in groupData"
          :key="group.group"
          :value="group.group"
      >
      <AccordionTrigger>{{ group.group }}</AccordionTrigger>
      <AccordionContent>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto p-4">
          <FriendGroupCard
              v-for="item in group.groupList"
              :key="item.name"
              :item="item"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>