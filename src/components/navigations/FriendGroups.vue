<script setup lang="ts">
import axios from 'axios'
import FriendGroupCard from "@/components/navigations/FriendGroupCard.vue";

import {
  ref,
  onMounted
} from 'vue'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

const groupData = ref<Array<any>>([])
const activeIdx = ref<Array<number | null>>([])
const openGroups = ref<string[]>([]) // 👈 用来控制展开的分组

async function fetchGroupData() {
  try {
    const response = await axios.get('https://suite-api.haruki.seiunx.com/misc/friend_groups')
    const data = response.data
    groupData.value = data
    activeIdx.value = data.map(() => null)
    openGroups.value = data.map((g: any) => g.group)
  } catch (error) {
    console.error('Failed to fetch group data:', error)
  }
}

function setActive(groupIdx: number, idx: number | null) {
  activeIdx.value[groupIdx] = idx
}

onMounted(() => {
  fetchGroupData()
})
</script>

<template>
  <Accordion
      v-model="openGroups"
      type="multiple"
      class="w-full max-w-5xl mx-auto"
      collapsible
  >
    <AccordionItem
        v-for="(group, groupIdx) in groupData"
        :key="group.group"
        :value="group.group"
    >
      <AccordionTrigger>{{ group.group }}</AccordionTrigger>
      <AccordionContent>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <FriendGroupCard
              v-for="(item, idx) in group.group_list"
              :key="item.name"
              :item="item"
              :active="activeIdx[groupIdx] === idx"
              @activate="() => setActive(groupIdx, idx)"
              @deactivate="() => setActive(groupIdx, null)"
              :idx="idx"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>