<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "vue-i18n"
import type { AdminWebhookSubscriber } from "@/types/admin"

const props = defineProps<{
  open: boolean
  subscribersLoading: boolean
  subscribers: AdminWebhookSubscriber[]
  subscribersGeneratedAt: string
  webhookId: string
  formatDate: (value?: string) => string
  serverLabel: (value: string) => string
  dataTypeLabel: (value: string) => string
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[720px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminWebhooks.subscribers.title", { id: props.webhookId }) }}</DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ t("adminWebhooks.subscribers.description") }}
          <span v-if="props.subscribersGeneratedAt" class="block mt-1">
            {{ t("adminWebhooks.subscribers.generatedAt", { date: props.formatDate(props.subscribersGeneratedAt) }) }}
          </span>
        </p>
      </DialogHeader>

      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminWebhooks.subscribers.userId") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.subscribers.server") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.subscribers.dataType") }}</TableHead>
              <TableHead>{{ t("adminWebhooks.subscribers.createdAt") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="props.subscribersLoading">
              <TableRow v-for="row in 3" :key="row">
                <TableCell colspan="4">
                  <Skeleton class="h-8 w-full" />
                </TableCell>
              </TableRow>
            </template>
            <template v-else-if="props.subscribers.length > 0">
              <TableRow v-for="subscriber in props.subscribers" :key="`${subscriber.userId}-${subscriber.server}-${subscriber.dataType}-${subscriber.createdAt}`">
                <TableCell class="font-medium">{{ subscriber.userId }}</TableCell>
                <TableCell>{{ props.serverLabel(subscriber.server) }}</TableCell>
                <TableCell>{{ props.dataTypeLabel(subscriber.dataType) }}</TableCell>
                <TableCell>{{ props.formatDate(subscriber.createdAt) }}</TableCell>
              </TableRow>
            </template>
            <TableRow v-else>
              <TableCell colspan="4" class="h-24 text-center text-muted-foreground">
                {{ t("adminWebhooks.subscribers.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
