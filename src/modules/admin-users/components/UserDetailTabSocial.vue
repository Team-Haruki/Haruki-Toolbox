<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    LucideCheckCircle2,
    LucideGlobe,
    LucideTrash2,
} from "lucide-vue-next"
import type { UserSocialPlatform } from "@/types/admin"
import { getSocialPlatforms } from "@/modules/admin-users/constants"

defineProps<{
    loading: boolean
    busy: boolean
    socialPlatform: UserSocialPlatform | null
}>()

const emit = defineEmits<{
    (e: "edit"): void
    (e: "delete"): void
}>()

const { t } = useI18n()
const socialPlatforms = computed(() => getSocialPlatforms(t))
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t("adminUsers.detail.social.title") }}</CardTitle>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton class="h-20 w-full" />
      </template>
      <template v-else-if="socialPlatform">
        <div class="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <component :is="socialPlatforms[socialPlatform.platform]?.icon || LucideGlobe" class="w-6 h-6" />
            </div>
            <div>
              <div class="font-semibold text-base">
                {{ socialPlatforms[socialPlatform.platform]?.label || socialPlatform.platform }}
              </div>
              <div class="text-sm text-muted-foreground font-mono mt-0.5">ID: {{ socialPlatform.userId }}</div>
              <div class="mt-1.5">
                <span :class="[
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                  socialPlatform.verified
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                ]">
                  <LucideCheckCircle2 v-if="socialPlatform.verified" class="w-3 h-3" />
                  {{ socialPlatform.verified ? t("adminUsers.common.verified") : t("adminUsers.common.unverified") }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="sm" :disabled="busy" @click="emit('edit')">{{ t("adminUsers.common.edit") }}</Button>
            <Button variant="ghost" size="sm" class="text-destructive" :disabled="busy" @click="emit('delete')">
              <LucideTrash2 class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center gap-3 py-8">
          <p class="text-muted-foreground">{{ t("adminUsers.detail.social.empty") }}</p>
          <Button variant="outline" size="sm" :disabled="busy" @click="emit('edit')">{{ t("adminUsers.detail.social.add") }}</Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
