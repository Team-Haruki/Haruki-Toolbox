<script setup lang="ts">
import { useI18n } from "vue-i18n"
import FriendGroupCard from "@/modules/navigation/components/FriendGroupCard.vue"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion"
import { useFriendGroups } from "@/modules/navigation/composables/useFriendGroups"

const { groupData, openGroups } = useFriendGroups()
const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 px-0 py-4 space-y-6">
    <!-- Header intro -->
    <div class="space-y-2 max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold tracking-tight">{{ t("navigationPages.friendGroups.title") }}</h1>
      <p class="text-muted-foreground">
        {{ t("navigationPages.friendGroups.description") }}
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
