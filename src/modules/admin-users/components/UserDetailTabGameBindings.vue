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
import {
    LucideMoreHorizontal,
    LucidePencil,
    LucideTrash2,
} from "lucide-vue-next"
import type { AdminGameAccountBinding } from "@/types/admin"
import { resolveServerLabel } from "@/modules/admin-users/constants"

defineProps<{
    loading: boolean
    busy: boolean
    gameBindings: AdminGameAccountBinding[]
}>()

const emit = defineEmits<{
    (e: "add"): void
    (e: "edit", binding: AdminGameAccountBinding): void
    (e: "delete", payload: { server: AdminGameAccountBinding["server"]; gameUserId: string }): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ t("adminUsers.detail.game.title") }}</CardTitle>
      <Button variant="outline" size="sm" :disabled="busy" @click="emit('add')">
        + {{ t("adminUsers.detail.game.add") }}
      </Button>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
      </template>
      <template v-else-if="gameBindings.length > 0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("adminUsers.detail.game.columns.server") }}</TableHead>
              <TableHead>{{ t("adminUsers.detail.game.columns.gameId") }}</TableHead>
              <TableHead>{{ t("adminUsers.common.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="binding in gameBindings" :key="`${binding.server}-${binding.gameUserId}`">
              <TableCell class="uppercase font-semibold text-primary">
                {{ resolveServerLabel(binding.server, t) }}
              </TableCell>
              <TableCell class="font-mono text-xs">{{ binding.gameUserId }}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0" :disabled="busy">
                      <span class="sr-only">{{ t("adminUsers.common.openMenu") }}</span>
                      <LucideMoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem :disabled="busy" @click="emit('edit', binding)">
                      <LucidePencil class="w-4 h-4 mr-2" />
                      {{ t("adminUsers.detail.game.edit") }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      class="text-destructive focus:text-destructive"
                      :disabled="busy"
                      @click="emit('delete', { server: binding.server, gameUserId: binding.gameUserId })"
                    >
                      <LucideTrash2 class="w-4 h-4 mr-2" />
                      {{ t("adminUsers.detail.game.unbind") }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
      <template v-else>
        <p class="text-center text-muted-foreground py-8">{{ t("adminUsers.detail.game.empty") }}</p>
      </template>
    </CardContent>
  </Card>
</template>
