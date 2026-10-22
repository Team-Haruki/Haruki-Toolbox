<script setup lang="ts">
import { computed, ref } from "vue"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    LucideGlobe,
    LucidePlus,
    LucideTrash2,
} from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { AuthorizedSocialPlatform } from "@/types/admin"
import { getSocialPlatforms, isSocialPlatform } from "@/modules/admin-users/constants"

const props = defineProps<{
    loading: boolean
    busy: boolean
    authorizedSocials: AuthorizedSocialPlatform[]
    /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
    deleteSocial: (platformId: AuthorizedSocialPlatform["id"]) => Promise<void>
}>()

const emit = defineEmits<{
    (e: "add"): void
    (e: "edit", social: AuthorizedSocialPlatform): void
}>()

const { t } = useI18n()
const socialPlatforms = computed(() => getSocialPlatforms(t))

const deleteDialogOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pendingDelete = ref<AuthorizedSocialPlatform | null>(null)

function platformMeta(platform: string) {
  return isSocialPlatform(platform) ? socialPlatforms.value[platform] : undefined
}

function requestDelete(social: AuthorizedSocialPlatform) {
  pendingDelete.value = social
  deleteDialogOpen.value = true
}

function executeDelete() {
  const target = pendingDelete.value
  return target ? props.deleteSocial(target.id) : Promise.resolve()
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between gap-2">
      <CardTitle>{{ t("adminUsers.detail.authSocial.title") }}</CardTitle>
      <Button variant="outline" size="sm" :disabled="busy" @click="emit('add')">
        <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.authSocial.add") }}
      </Button>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
      </template>
      <template v-else-if="authorizedSocials.length > 0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminUsers.detail.authSocial.columns.platform") }}</TableHead>
              <TableHead>{{ t("adminUsers.detail.authSocial.columns.userId") }}</TableHead>
              <TableHead>{{ t("adminUsers.detail.authSocial.columns.comment") }}</TableHead>
              <TableHead>{{ t("adminUsers.common.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="social in authorizedSocials" :key="social.id">
              <TableCell class="font-medium">
                <div class="flex items-center gap-2">
                  <component :is="platformMeta(social.platform)?.icon || LucideGlobe" class="w-4 h-4 text-muted-foreground" />
                  {{ platformMeta(social.platform)?.label || social.platform }}
                </div>
              </TableCell>
              <TableCell>{{ social.userId }}</TableCell>
              <TableCell class="text-muted-foreground">{{ social.comment || "—" }}</TableCell>
              <TableCell>
                <div class="flex gap-1">
                  <Button variant="ghost" size="sm" :disabled="busy" @click="emit('edit', social)">{{ t("adminUsers.common.edit") }}</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    :disabled="busy"
                    :title="t('adminUsers.detail.info.delete')"
                    :aria-label="t('adminUsers.detail.info.delete')"
                    @click="requestDelete(social)"
                  >
                    <LucideTrash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <LucideGlobe class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.authSocial.empty") }}</p>
          <Button variant="outline" size="sm" :disabled="busy" @click="emit('add')">
            <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.authSocial.add") }}
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>

  <ConfirmDialog
    v-model:open="deleteDialogOpen"
    :title="t('adminUsers.detail.authSocial.deleteDialogTitle')"
    :description="t('adminUsers.detail.authSocial.deleteDialogDescription')"
    :cancel-label="t('adminUsers.common.cancel')"
    :confirm-label="t('adminUsers.detail.info.delete')"
    destructive
    :on-confirm="executeDelete"
  />
</template>
