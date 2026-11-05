<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import FriendGroupCard from "@/modules/navigation/components/FriendGroupCard.vue"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { describeError } from "@/lib/error-utils"
import { useFriendGroups } from "@/modules/navigation/composables/useFriendGroups"

const { groupData, openGroups, loading, error, reload } = useFriendGroups()
const { t } = useI18n()

const errorDescription = computed(() =>
  error.value == null ? null : describeError(error.value, t("navigationPages.friendGroups.toast.loadFailedTitle")))
</script>

<template>
  <div class="mx-auto w-full max-w-6xl flex-1 space-y-6 px-0 py-4">
    <PageHeader :title="t('navigationPages.friendGroups.title')" :description="t('navigationPages.friendGroups.description')" />

    <div v-if="loading" class="text-center py-10 text-muted-foreground">
      {{ t("navigationPages.friendGroups.loading") }}
    </div>

    <!-- Backend failure: distinct from a genuinely empty list -->
    <LoadErrorState
      v-else-if="errorDescription"
      :description="errorDescription.message"
      :detail="errorDescription.detail"
      :retrying="loading"
      @retry="reload"
    />

    <div v-else-if="groupData.length === 0" class="text-center py-10 text-muted-foreground">
      {{ t("navigationPages.friendGroups.empty") }}
    </div>

    <Accordion
        v-else
        v-model="openGroups"
        type="multiple"
        class="w-full"
        collapsible
    >
      <AccordionItem
          v-for="group in groupData"
          :key="group.group"
          :value="group.group"
      >
      <AccordionTrigger>{{ group.group }}</AccordionTrigger>
      <AccordionContent>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          <FriendGroupCard
              v-for="(item, index) in group.groupList"
              :key="`${group.group}-${item.name}-${index}`"
              :item="item"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>
