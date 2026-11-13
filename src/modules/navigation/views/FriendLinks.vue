<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideNavigation } from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { describeError } from "@/lib/error-utils"
import { useFriendLinks } from "@/modules/navigation/composables/useFriendLinks"
import { resolveLinkHost } from "@/modules/navigation/lib/friend-pages"

const { friendLinks, loading, error, reload } = useFriendLinks()
const { t } = useI18n()

const errorDescription = computed(() =>
  error.value == null ? null : describeError(error.value, t("navigationPages.friendLinks.toast.loadFailedTitle")))

const links = computed(() => friendLinks.value.map((friend) => ({ ...friend, host: resolveLinkHost(friend.url) })))
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-0 py-4">
    <PageHeader :title="t('navigationPages.friendLinks.title')" />

    <div v-if="loading" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="status" :aria-label="t('navigationPages.friendLinks.loading')">
      <Skeleton v-for="index in 6" :key="index" class="h-24 w-full rounded-xl" />
    </div>

    <!-- Backend failure: say so and offer a retry instead of a blank page -->
    <LoadErrorState
      v-else-if="errorDescription"
      :description="errorDescription.message"
      :detail="errorDescription.detail"
      :retrying="loading"
      @retry="reload"
    />

    <div v-else-if="links.length === 0" class="rounded-xl border border-dashed">
      <EmptyState :title="t('navigationPages.friendLinks.empty')" :icon="LucideNavigation" />
    </div>

    <!-- Each site is one tile and one link: who it is, where it goes, what
         it is for. The columns follow the list's own width. -->
    <div v-else class="@container" data-testid="friend-links">
      <ul class="grid grid-cols-1 gap-2 @min-[40rem]:grid-cols-2 @min-[64rem]:grid-cols-3" role="list">
        <li v-for="friend in links" :key="friend.id" class="min-w-0">
          <a
            :href="friend.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex h-full min-w-0 items-start gap-3 rounded-xl border bg-card p-3 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/30"
            data-slot="friend-link-card"
          >
            <Avatar class="size-10 shrink-0">
              <AvatarImage :src="friend.avatar" alt="" />
              <AvatarFallback>{{ friend.name.charAt(0) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-semibold [overflow-wrap:anywhere]">{{ friend.name }}</p>
                  <p v-if="friend.host" class="truncate text-xs text-muted-foreground" :title="friend.url">{{ friend.host }}</p>
                </div>
                <LucideExternalLink
                  class="mt-0.5 size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <p v-if="friend.description" class="mt-1.5 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {{ friend.description }}
              </p>
              <ul v-if="friend.tags.length > 0" class="mt-2 flex flex-wrap gap-1" role="list">
                <li
                  v-for="tag in friend.tags"
                  :key="tag"
                  class="max-w-full truncate rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {{ tag }}
                </li>
              </ul>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
