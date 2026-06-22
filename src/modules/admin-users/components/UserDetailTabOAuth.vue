<script setup lang="ts">
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { UserOAuthAuthorization } from "@/modules/admin-users/api/oauth"

defineProps<{
    loading: boolean
    busy: boolean
    authorizations: UserOAuthAuthorization[]
}>()

const emit = defineEmits<{
    (e: "revoke-all"): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ t("adminUsers.detail.oauth.title") }}</CardTitle>
      <AlertDialog v-if="authorizations.length > 0">
        <AlertDialogTrigger as-child>
          <Button variant="destructive" size="sm" :disabled="busy">
            {{ t("adminUsers.detail.oauth.revokeAll") }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t("adminUsers.detail.oauth.revokeAllDialogTitle") }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ t("adminUsers.detail.oauth.revokeAllDialogDescription") }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
            <AlertDialogAction @click="emit('revoke-all')">{{ t("adminUsers.common.confirm") }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
      </template>
      <template v-else-if="authorizations.length > 0">
        <div class="text-sm text-muted-foreground">
          {{ t("adminUsers.detail.oauth.total", { count: authorizations.length }) }}
        </div>
      </template>
      <template v-else>
        <p class="text-center text-muted-foreground py-8">{{ t("adminUsers.detail.oauth.empty") }}</p>
      </template>
    </CardContent>
  </Card>
</template>
