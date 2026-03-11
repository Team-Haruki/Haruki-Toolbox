<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { AdminFriendLink } from "@/types/admin"

defineProps<{
  loading: boolean
  links: AdminFriendLink[]
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "create"): void
  (e: "edit", link: AdminFriendLink): void
  (e: "delete", id: string): void
}>()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="text-lg">{{ t("adminContent.linksTab.title") }}</CardTitle>
      <Button size="sm" @click="emit('create')">
        <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminContent.linksTab.createButton") }}
      </Button>
    </CardHeader>
    <CardContent class="p-0">
      <template v-if="loading">
        <div class="p-6 flex flex-col gap-3">
          <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminContent.linksTab.table.name") }}</TableHead>
              <TableHead class="hidden sm:table-cell">{{ t("adminContent.linksTab.table.url") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminContent.linksTab.table.tags") }}</TableHead>
              <TableHead>{{ t("adminContent.linksTab.table.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="link in links" :key="link.id">
              <TableCell class="font-medium">{{ link.name }}</TableCell>
              <TableCell class="hidden sm:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                {{ link.url }}
              </TableCell>
              <TableCell class="hidden md:table-cell">
                <div class="flex gap-1 flex-wrap">
                  <span
                    v-for="tag in (link.tags || [])"
                    :key="tag"
                    class="bg-muted px-1.5 py-0.5 rounded text-xs"
                  >
                    {{ tag }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex gap-1">
                  <Button variant="ghost" size="sm" @click="emit('edit', link)">
                    <LucidePencil class="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button variant="ghost" size="sm" class="text-destructive">
                        <LucideTrash2 class="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{{ t("adminContent.linksTab.deleteDialog.title") }}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {{ t("adminContent.linksTab.deleteDialog.description", { name: link.name }) }}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{{ t("adminContent.linksTab.deleteDialog.cancel") }}</AlertDialogCancel>
                        <AlertDialogAction @click="emit('delete', link.id)">
                          {{ t("adminContent.linksTab.deleteDialog.confirm") }}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="links.length === 0">
              <TableCell :colspan="4" class="text-center py-8 text-muted-foreground">
                {{ t("adminContent.linksTab.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
  </Card>
</template>
