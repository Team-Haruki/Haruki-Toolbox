<script setup lang="ts">
import { h } from "vue"
import { useI18n } from "vue-i18n"
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table"
import type { ColumnDef } from "@tanstack/vue-table"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Inbox, KeyRound, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-vue-next"

const props = defineProps<{
  data: GameAccountBinding[]
  regionLabels: Record<SekaiRegion, string>
}>()

const emit = defineEmits<{
  (e: "add"): void
  (e: "edit", account: GameAccountBinding): void
  (e: "delete", account: GameAccountBinding): void
  (e: "grants", account: GameAccountBinding): void
  (e: "received-grants"): void
  (e: "set-default", account: GameAccountBinding): void
}>()

const { t } = useI18n()

const columns: ColumnDef<GameAccountBinding>[] = [
  {
    accessorKey: "server",
    header: () => t("userSettings.gameBinding.table.server"),
    cell: ({ row }) => props.regionLabels[row.original.server] ?? row.original.server,
  },
  {
    accessorKey: "userId",
    header: () => t("userSettings.gameBinding.table.userId"),
    cell: ({ row }) =>
      h("span", { class: "inline-flex items-center gap-1.5" }, [
        String(row.original.userId),
        row.original.isDefault
          ? h(
              "span",
              { class: "inline-flex items-center gap-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600 dark:text-amber-400" },
              [h(Star, { class: "h-3 w-3" }), t("userSettings.gameBinding.status.default")],
            )
          : null,
      ]),
  },
  {
    accessorKey: "verified",
    header: () => t("userSettings.gameBinding.table.verificationStatus"),
    cell: ({ row }) =>
      h(VerificationStatusBadge, {
        verified: row.original.verified,
        verifiedLabel: t("userSettings.gameBinding.status.verified"),
        unverifiedLabel: t("userSettings.gameBinding.status.unverified"),
      }),
  },
  {
    id: "actions",
    header: () => t("userSettings.gameBinding.table.actions"),
    cell: ({ row }) =>
      h(DropdownMenu, null, {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h(Button, { variant: "ghost", size: "icon" }, () =>
              h(MoreHorizontal, { class: "h-4 w-4" })
            )
          ),
          h(DropdownMenuContent, { align: "end" }, () => [
            h(DropdownMenuItem, { onClick: () => emit("edit", row.original) }, () => [
              h(Pencil, { class: "h-4 w-4 mr-2" }),
              t("userSettings.gameBinding.actions.edit"),
            ]),
            row.original.verified && !row.original.isDefault
              ? h(DropdownMenuItem, { onClick: () => emit("set-default", row.original) }, () => [
                h(Star, { class: "h-4 w-4 mr-2" }),
                t("userSettings.gameBinding.actions.setDefault"),
              ])
              : null,
            row.original.verified
              ? h(DropdownMenuItem, { onClick: () => emit("grants", row.original) }, () => [
                h(KeyRound, { class: "h-4 w-4 mr-2" }),
                t("userSettings.gameBinding.actions.grants"),
              ])
              : null,
            h(
              DropdownMenuItem,
              { onClick: () => emit("delete", row.original), class: "text-destructive" },
              () => [
                h(Trash2, { class: "h-4 w-4 mr-2" }),
                t("userSettings.gameBinding.actions.delete"),
              ]
            ),
          ]),
        ],
      }),
  },
]

const table = useVueTable({
  get data() {
    return props.data
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <Card class="w-full max-w-2xl">
    <CardHeader class="space-y-4">
      <div>
        <CardTitle>{{ t("userSettings.gameBinding.title") }}</CardTitle>
        <CardDescription>
          {{ t("userSettings.gameBinding.description") }}
        </CardDescription>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" class="w-full sm:w-auto" @click="emit('received-grants')">
          <Inbox class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.actions.receivedGrants") }}
        </Button>
        <Button class="w-full sm:w-auto" @click="emit('add')">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.addButton") }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-center">
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="table.getRowModel().rows?.length">
              <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="text-center">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-else>
              <TableCell :colspan="columns.length" class="h-24 text-center">
                {{ t("userSettings.gameBinding.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
