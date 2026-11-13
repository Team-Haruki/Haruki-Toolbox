<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideUsers } from "lucide-vue-next"
import { Skeleton } from "@/components/ui/skeleton"
import FriendGroupCard from "@/modules/navigation/components/FriendGroupCard.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { describeError } from "@/lib/error-utils"
import { useFriendGroups } from "@/modules/navigation/composables/useFriendGroups"

const { groupData, loading, error, reload } = useFriendGroups()
const { t } = useI18n()

const errorDescription = computed(() =>
  error.value == null ? null : describeError(error.value, t("navigationPages.friendGroups.toast.loadFailedTitle")))
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-0 py-4">
    <PageHeader :title="t('navigationPages.friendGroups.title')" :description="t('navigationPages.friendGroups.description')" />

    <div v-if="loading" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="status" :aria-label="t('navigationPages.friendGroups.loading')">
      <Skeleton v-for="index in 6" :key="index" class="h-24 w-full rounded-xl" />
    </div>

    <!-- Backend failure: distinct from a genuinely empty list -->
    <LoadErrorState
      v-else-if="errorDescription"
      :description="errorDescription.message"
      :detail="errorDescription.detail"
      :retrying="loading"
      @retry="reload"
    />

    <div v-else-if="groupData.length === 0" class="rounded-xl border border-dashed">
      <EmptyState :title="t('navigationPages.friendGroups.empty')" :icon="LucideUsers" />
    </div>

    <!-- One section per category: a heading with its count, then the groups
         as tiles. The columns follow the section's own width. -->
    <template v-else>
      <section
        v-for="group in groupData"
        :key="group.group"
        class="@container flex flex-col gap-2"
        data-testid="friend-group-section"
      >
        <h2 class="flex items-baseline gap-2 px-1 text-sm font-semibold">
          {{ group.group }}
          <span class="text-xs font-normal tabular-nums text-muted-foreground">
            {{ t("navigationPages.friendGroups.count", { count: group.groupList.length }) }}
          </span>
        </h2>
        <div class="grid grid-cols-1 gap-2 @min-[44rem]:grid-cols-2 @min-[68rem]:grid-cols-3">
          <div
            v-for="(item, index) in group.groupList"
            :key="`${group.group}-${item.name}-${index}`"
            class="@container min-w-0"
          >
            <FriendGroupCard :item="item" class="h-full" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
