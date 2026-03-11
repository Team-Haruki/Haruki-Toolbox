<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
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
import {
  LucideTrash2,
  LucideRefreshCw,
  LucideCircleDot,
} from "lucide-vue-next"
import { useAdminSessions } from "@/modules/admin-sessions/composables/useAdminSessions"

const { t } = useI18n()

const {
  loading,
  sessions,
  actionLoading,
  handleDelete,
  handleReauth,
  formatDate,
  formatTtl,
} = useAdminSessions()

</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-lg">{{ t("adminSessions.title") }}</CardTitle>
          <CardDescription>{{ t("adminSessions.description") }}</CardDescription>
        </div>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleReauth">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminSessions.reauthButton") }}
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("adminSessions.table.sessionId") }}</TableHead>
                <TableHead>{{ t("adminSessions.table.expiresAt") }}</TableHead>
                <TableHead>{{ t("adminSessions.table.ttl") }}</TableHead>
                <TableHead class="w-16">{{ t("adminSessions.table.actions") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="s in sessions" :key="s.sessionTokenId" :class="s.current ? 'bg-primary/5' : ''">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono truncate max-w-[200px]">{{ s.sessionTokenId.slice(0, 8) }}…</span>
                    <span v-if="s.current" class="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <LucideCircleDot class="w-3 h-3" /> {{ t("adminSessions.currentTag") }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(s.expiresAt) }}</TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatTtl(s.ttlSeconds) }}</TableCell>
                <TableCell>
                  <AlertDialog v-if="!s.current">
                    <AlertDialogTrigger as-child>
                      <Button variant="ghost" size="sm" class="text-destructive" :disabled="actionLoading">
                        <LucideTrash2 class="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{{ t("adminSessions.deleteDialog.title") }}</AlertDialogTitle>
                        <AlertDialogDescription>{{ t("adminSessions.deleteDialog.description") }}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{{ t("adminSessions.deleteDialog.cancel") }}</AlertDialogCancel>
                        <AlertDialogAction :disabled="actionLoading" @click="handleDelete(s.sessionTokenId)">
                          {{ t("adminSessions.deleteDialog.confirm") }}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
              <TableRow v-if="sessions.length === 0">
                <TableCell :colspan="4" class="text-center py-8 text-muted-foreground">{{ t("adminSessions.empty") }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
