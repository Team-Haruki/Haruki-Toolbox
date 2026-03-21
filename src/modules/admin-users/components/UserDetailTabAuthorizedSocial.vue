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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    LucideGlobe,
    LucideTrash2,
} from "lucide-vue-next"
import type { AuthorizedSocialPlatform } from "@/types/admin"
import { getSocialPlatforms } from "@/modules/admin-users/constants"

defineProps<{
    loading: boolean
    busy: boolean
    authorizedSocials: AuthorizedSocialPlatform[]
}>()

const emit = defineEmits<{
    (e: "add"): void
    (e: "edit", social: AuthorizedSocialPlatform): void
    (e: "delete", platformId: AuthorizedSocialPlatform["id"]): void
}>()

const { t } = useI18n()
const socialPlatforms = computed(() => getSocialPlatforms(t))
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ t("adminUsers.detail.authSocial.title") }}</CardTitle>
      <Button variant="outline" size="sm" :disabled="busy" @click="emit('add')">
        + {{ t("adminUsers.detail.authSocial.add") }}
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
                  <component :is="socialPlatforms[social.platform]?.icon || LucideGlobe" class="w-4 h-4 text-muted-foreground" />
                  {{ socialPlatforms[social.platform]?.label || social.platform }}
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
                    class="text-destructive"
                    :disabled="busy"
                    @click="emit('delete', social.id)"
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
        <div class="flex flex-col items-center gap-3 py-8">
          <p class="text-muted-foreground">{{ t("adminUsers.detail.authSocial.empty") }}</p>
          <Button variant="outline" size="sm" :disabled="busy" @click="emit('add')">{{ t("adminUsers.detail.authSocial.add") }}</Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
