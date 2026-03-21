import { h, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { ColumnDef } from "@tanstack/vue-table"
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-vue-next"
import type { SocialAuth } from "@/modules/user-settings/composables/useIMAuthorizationSettings"

type UseIMAuthorizationTableOptions = {
  tableData: Ref<SocialAuth[]>
  getPlatformLabel: (platform: SocialAuth["platform"]) => string
  onEdit: (row: SocialAuth) => void
  onDelete: (row: SocialAuth) => void
}

export function useIMAuthorizationTable(options: UseIMAuthorizationTableOptions) {
  const { t } = useI18n()

  const columns: ColumnDef<SocialAuth>[] = [
    {
      accessorKey: "platform",
      header: () => t("userSettings.imAuthorization.table.platform"),
      cell: ({ row }) => options.getPlatformLabel(row.original.platform),
    },
    {
      accessorKey: "userId",
      header: () => t("userSettings.imAuthorization.table.account"),
      cell: ({ row }) => row.getValue("userId"),
    },
    {
      accessorKey: "comment",
      header: () => t("userSettings.imAuthorization.table.remark"),
      cell: ({ row }) => row.getValue("comment"),
    },
    {
      id: "actions",
      header: () => t("userSettings.imAuthorization.table.actions"),
      cell: ({ row }) =>
        h(DropdownMenu, null, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, () =>
              h(Button, { variant: "ghost", size: "icon" }, () => h(MoreHorizontal, { class: "h-4 w-4" }))
            ),
            h(DropdownMenuContent, { align: "end" }, () => [
              h(DropdownMenuItem, { onClick: () => options.onEdit(row.original) }, () => [
                h(Pencil, { class: "h-4 w-4 mr-2" }),
                t("userSettings.imAuthorization.actions.edit"),
              ]),
              h(DropdownMenuItem, { onClick: () => options.onDelete(row.original), class: "text-destructive" }, () => [
                h(Trash2, { class: "h-4 w-4 mr-2" }),
                t("userSettings.imAuthorization.actions.delete"),
              ]),
            ]),
          ],
        }),
    },
  ]

  const table = useVueTable({
    get data() {
      return options.tableData.value
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return {
    columns,
    table,
    FlexRender,
  }
}
