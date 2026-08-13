<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideArrowRightLeft,
  LucideChevronLeft,
  LucideChevronRight,
  LucideInbox,
  LucideLoader2,
  LucideMoreHorizontal,
  LucidePencil,
  LucideTrash2,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"
import { formatNumberCN } from "@/lib/number-format"

interface Props {
  loading: boolean
  bindings: GlobalGameBinding[]
  selected: Set<string>
  selectAll: boolean
  total: number
  page: number
  totalPages: number
  actionLoading: boolean
  bindingKey: (binding: GlobalGameBinding) => string
  serverLabel: (server: string) => string
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "toggle-select", key: string): void
  (event: "toggle-select-all"): void
  (event: "open-edit", binding: GlobalGameBinding): void
  (event: "open-reassign", binding: GlobalGameBinding): void
  (event: "open-delete", binding: GlobalGameBinding): void
  (event: "batch-delete"): void
  (event: "prev-page"): void
  (event: "next-page"): void
}>()

function isSelected(binding: GlobalGameBinding): boolean {
  return props.selected.has(props.bindingKey(binding))
}
</script>

<template>
  <Card class="gap-0 overflow-hidden py-0">
    <CardContent class="p-0">
      <!-- Selection toolbar: always rendered so revealing the batch action never shifts layout -->
      <div class="flex h-12 items-center justify-between gap-3 border-b px-4">
        <span
          class="text-sm text-muted-foreground tabular-nums transition-opacity duration-200"
          :class="props.selected.size > 0 ? 'opacity-100' : 'opacity-0'"
          :aria-hidden="props.selected.size === 0"
        >
          {{ t("adminGameBindings.table.selectedCount", { count: props.selected.size }) }}
        </span>
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button
              variant="destructive"
              size="sm"
              :disabled="props.selected.size === 0 || props.actionLoading"
            >
              <LucideTrash2 class="w-4 h-4 mr-1" />
              {{ t("adminGameBindings.table.batchUnbind") }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t("adminGameBindings.table.batchDialog.title") }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ t("adminGameBindings.table.batchDialog.description", { count: props.selected.size }) }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t("adminGameBindings.table.batchDialog.cancel") }}</AlertDialogCancel>
              <AlertDialogAction :disabled="props.actionLoading" @click="emit('batch-delete')">
                <LucideLoader2 v-if="props.actionLoading" class="w-4 h-4 mr-1 animate-spin" />
                {{ t("adminGameBindings.table.batchDialog.confirm") }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <template v-if="props.loading">
        <div class="flex flex-col gap-3 p-6">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <div
        v-else-if="props.bindings.length === 0"
        class="flex flex-col items-center justify-center gap-3 py-12 text-center"
      >
        <LucideInbox class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">{{ t("adminGameBindings.table.empty") }}</p>
      </div>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-10">
                <Checkbox
                  :model-value="props.selectAll"
                  :aria-label="t('adminGameBindings.table.selectAll')"
                  @update:model-value="emit('toggle-select-all')"
                />
              </TableHead>
              <TableHead>{{ t("adminGameBindings.table.columns.server") }}</TableHead>
              <TableHead>{{ t("adminGameBindings.table.columns.gameId") }}</TableHead>
              <TableHead>{{ t("adminGameBindings.table.columns.user") }}</TableHead>
              <TableHead>{{ t("adminGameBindings.table.columns.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="binding in props.bindings"
              :key="props.bindingKey(binding)"
              :data-state="isSelected(binding) ? 'selected' : undefined"
            >
              <TableCell>
                <Checkbox
                  :model-value="isSelected(binding)"
                  :aria-label="t('adminGameBindings.table.selectRow')"
                  @update:model-value="emit('toggle-select', props.bindingKey(binding))"
                />
              </TableCell>
              <TableCell>
                <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted">
                  {{ props.serverLabel(binding.server) }}
                </span>
              </TableCell>
              <TableCell class="font-mono text-sm tabular-nums">{{ binding.gameUserId }}</TableCell>
              <TableCell>
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ binding.userName || binding.userId }}</span>
                  <span v-if="binding.userName" class="text-xs text-muted-foreground">ID: {{ binding.userId }}</span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-8 w-8 p-0"
                      :title="t('adminGameBindings.table.openMenu')"
                      :aria-label="t('adminGameBindings.table.openMenu')"
                    >
                      <LucideMoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{{ t("adminGameBindings.table.columns.actions") }}</DropdownMenuLabel>
                    <DropdownMenuItem @click="emit('open-edit', binding)">
                      <LucidePencil class="w-4 h-4 mr-2" />
                      {{ t("adminGameBindings.table.menu.edit") }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="emit('open-reassign', binding)">
                      <LucideArrowRightLeft class="w-4 h-4 mr-2" />
                      {{ t("adminGameBindings.table.menu.reassign") }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive focus:text-destructive" @click="emit('open-delete', binding)">
                      <LucideTrash2 class="w-4 h-4 mr-2" />
                      {{ t("adminGameBindings.table.menu.unbind") }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>

      <!-- Pagination footer attached to the table card -->
      <div class="flex items-center justify-between gap-3 border-t px-4 py-3">
        <span class="text-sm text-muted-foreground">
          {{ t("adminGameBindings.table.total", { total: formatNumberCN(props.total, "0") }) }}
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="props.page <= 1"
            :title="t('adminGameBindings.pagination.prevPage')"
            :aria-label="t('adminGameBindings.pagination.prevPage')"
            @click="emit('prev-page')"
          >
            <LucideChevronLeft class="w-4 h-4" />
          </Button>
          <span class="text-sm tabular-nums">{{ props.page }} / {{ props.totalPages }}</span>
          <Button
            variant="outline"
            size="sm"
            :disabled="props.page >= props.totalPages"
            :title="t('adminGameBindings.pagination.nextPage')"
            :aria-label="t('adminGameBindings.pagination.nextPage')"
            @click="emit('next-page')"
          >
            <LucideChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
