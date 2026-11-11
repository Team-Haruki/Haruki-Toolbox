<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { LucideCheck, LucideCopy, LucideExternalLink } from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { copyTextToClipboard } from "@/lib/clipboard"
import { extractGroupNumber } from "@/modules/navigation/lib/friend-pages"
import type { FriendGroupItem } from "@/modules/navigation/types"

/**
 * One recommended group: its banner as a thumbnail on the left, then the
 * avatar and name, the group number with a copy button, and the description
 * in full. Everything is on the tile at rest; nothing waits for a hover,
 * which a phone does not have.
 */
const props = defineProps<{
  item: FriendGroupItem
}>()

const { t } = useI18n()

const groupNumber = computed(() => extractGroupNumber(props.item.groupInfo))

// A banner that fails to load is dropped; the tile works without it.
const bannerFailed = ref(false)
watch(() => props.item.bg, () => {
  bannerFailed.value = false
})

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyGroupNumber() {
  if (!groupNumber.value) {
    return
  }
  if (await copyTextToClipboard(groupNumber.value)) {
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
    toast.success(t("navigationPages.friendGroups.copied", { number: groupNumber.value }))
  } else {
    toast.error(t("navigationPages.friendGroups.copyFailed"))
  }
}
</script>

<template>
  <article class="flex min-w-0 items-start gap-3 rounded-xl border bg-card p-2.5" data-slot="friend-group-card">
    <div
      v-if="item.bg && !bannerFailed"
      class="relative aspect-[3/2] w-24 shrink-0 overflow-hidden rounded-lg bg-muted @min-[26rem]:w-32"
    >
      <img
        :src="item.bg"
        alt=""
        class="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
        @error="bannerFailed = true"
      >
    </div>

    <div class="min-w-0 flex-1 py-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <Avatar class="size-7 shrink-0">
          <AvatarImage :src="item.avatar" alt="" />
          <AvatarFallback class="text-xs">{{ item.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-w-0 items-center gap-1 rounded text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span class="min-w-0 [overflow-wrap:anywhere]">{{ item.name }}</span>
          <LucideExternalLink class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </a>
        <h3 v-else class="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{{ item.name }}</h3>
      </div>

      <div v-if="item.groupInfo" class="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
        <span class="min-w-0 text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">{{ item.groupInfo }}</span>
        <button
          v-if="groupNumber"
          type="button"
          class="-my-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10"
          :aria-label="t('navigationPages.friendGroups.copyNumber', { number: groupNumber })"
          :title="t('navigationPages.friendGroups.copyNumber', { number: groupNumber })"
          data-testid="friend-group-copy"
          @click="copyGroupNumber"
        >
          <LucideCheck v-if="copied" class="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <LucideCopy v-else class="size-3.5" />
        </button>
      </div>

      <p v-if="item.detail" class="mt-1 text-xs leading-relaxed whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]">
        {{ item.detail }}
      </p>
    </div>
  </article>
</template>
