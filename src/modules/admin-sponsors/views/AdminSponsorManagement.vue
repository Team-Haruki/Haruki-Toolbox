<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  LucideBan,
  LucideCheckCircle2,
  LucideHeartHandshake,
  LucideLoader2,
  LucidePencil,
  LucideRefreshCw,
  LucideSave,
  LucideShieldCheck,
  LucideSparkles,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminSponsorManagement } from "@/modules/admin-sponsors/composables/useAdminSponsorManagement"
import type { AdminSponsorProfile } from "@/types/admin"

const { t } = useI18n()

const {
  loading,
  refreshing,
  saving,
  syncing,
  sponsors,
  generatedAt,
  total,
  activeCount,
  manualProfileCount,
  editOpen,
  editingSponsor,
  form,
  refreshSponsors,
  openEditDialog,
  saveSponsor,
  toggleAfdianSync,
  syncFromAfdian,
  formatDate,
} = useAdminSponsorManagement()

function fallbackName(sponsor: AdminSponsorProfile | null) {
  return sponsor?.name || t("adminSponsors.common.anonymous")
}

function fallbackInitial(sponsor: AdminSponsorProfile | null) {
  return fallbackName(sponsor).charAt(0).toUpperCase()
}

function statusClass(active: boolean) {
  return active
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
}

function sourceLabel(source: string) {
  return source || t("adminSponsors.common.fallback")
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-lg">
            <LucideHeartHandshake class="h-5 w-5 text-pink-500" />
            {{ t("adminSponsors.title") }}
          </CardTitle>
          <CardDescription>
            {{ t("adminSponsors.description") }}
            <span v-if="generatedAt" class="block mt-1">
              {{ t("adminSponsors.generatedAt", { date: formatDate(generatedAt) }) }}
            </span>
          </CardDescription>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" :disabled="loading || refreshing" @click="refreshSponsors">
            <LucideLoader2 v-if="refreshing" class="mr-2 h-4 w-4 animate-spin" />
            <LucideRefreshCw v-else class="mr-2 h-4 w-4" />
            {{ t("adminSponsors.actions.refresh") }}
          </Button>
          <Button variant="outline" :disabled="loading || syncing" @click="syncFromAfdian">
            <LucideLoader2 v-if="syncing" class="mr-2 h-4 w-4 animate-spin" />
            <LucideSparkles v-else class="mr-2 h-4 w-4" />
            {{ t("adminSponsors.actions.syncAfdian") }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="rounded-xl border bg-muted/20 p-4">
            <p class="text-sm text-muted-foreground">{{ t("adminSponsors.stats.total") }}</p>
            <p class="mt-1 text-2xl font-semibold tracking-tight">{{ total }}</p>
          </div>
          <div class="rounded-xl border bg-muted/20 p-4">
            <p class="text-sm text-muted-foreground">{{ t("adminSponsors.stats.active") }}</p>
            <p class="mt-1 text-2xl font-semibold tracking-tight">{{ activeCount }}</p>
          </div>
          <div class="rounded-xl border bg-muted/20 p-4">
            <p class="text-sm text-muted-foreground">{{ t("adminSponsors.stats.manualProfile") }}</p>
            <p class="mt-1 text-2xl font-semibold tracking-tight">{{ manualProfileCount }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">{{ t("adminSponsors.list.title") }}</CardTitle>
        <CardDescription>{{ t("adminSponsors.list.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("adminSponsors.table.supporter") }}</TableHead>
                <TableHead>{{ t("adminSponsors.table.tier") }}</TableHead>
                <TableHead>{{ t("adminSponsors.table.status") }}</TableHead>
                <TableHead class="hidden md:table-cell">{{ t("adminSponsors.table.source") }}</TableHead>
                <TableHead class="hidden lg:table-cell">{{ t("adminSponsors.table.lastSupport") }}</TableHead>
                <TableHead>{{ t("adminSponsors.table.afdianSync") }}</TableHead>
                <TableHead class="text-right">{{ t("adminSponsors.table.actions") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="row in 6" :key="row">
                  <TableCell colspan="7">
                    <Skeleton class="h-9 w-full" />
                  </TableCell>
                </TableRow>
              </template>

              <template v-else-if="sponsors.length > 0">
                <TableRow v-for="sponsor in sponsors" :key="sponsor.id">
                  <TableCell>
                    <div class="flex min-w-[180px] items-center gap-3">
                      <Avatar class="h-9 w-9 border">
                        <AvatarImage :src="sponsor.avatar" :alt="fallbackName(sponsor)" />
                        <AvatarFallback class="text-xs font-semibold">{{ fallbackInitial(sponsor) }}</AvatarFallback>
                      </Avatar>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium">{{ fallbackName(sponsor) }}</p>
                        <p class="truncate font-mono text-[11px] text-muted-foreground">{{ sponsor.id }}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span class="line-clamp-2 max-w-[180px] text-sm">
                      {{ sponsor.planName || t("adminSponsors.common.fallback") }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusClass(sponsor.isActive),
                      ]"
                    >
                      <LucideCheckCircle2 v-if="sponsor.isActive" class="h-3.5 w-3.5" />
                      <LucideBan v-else class="h-3.5 w-3.5" />
                      {{ sponsor.isActive ? t("adminSponsors.status.active") : t("adminSponsors.status.past") }}
                    </span>
                  </TableCell>
                  <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                    {{ sourceLabel(sponsor.source) }}
                  </TableCell>
                  <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                    {{ formatDate(sponsor.paidAt) }}
                  </TableCell>
                  <TableCell>
                    <div class="flex min-w-[170px] items-center gap-2">
                      <Switch
                        :model-value="sponsor.afdianSyncDisabled"
                        :disabled="saving"
                        @update:model-value="toggleAfdianSync(sponsor, !!$event)"
                      />
                      <span class="text-xs text-muted-foreground">
                        {{ sponsor.afdianSyncDisabled ? t("adminSponsors.afdianSync.disabled") : t("adminSponsors.afdianSync.enabled") }}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button variant="ghost" size="sm" @click="openEditDialog(sponsor)">
                      <LucidePencil class="mr-2 h-4 w-4" />
                      {{ t("adminSponsors.actions.edit") }}
                    </Button>
                  </TableCell>
                </TableRow>
              </template>

              <TableRow v-else>
                <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                  {{ t("adminSponsors.table.empty") }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="editOpen">
      <DialogScrollContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t("adminSponsors.edit.title") }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-4 py-2">
          <div class="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
            <Avatar class="h-11 w-11 border">
              <AvatarImage :src="form.avatar" :alt="fallbackName(editingSponsor)" />
              <AvatarFallback class="text-sm font-semibold">{{ fallbackInitial(editingSponsor) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ form.name || fallbackName(editingSponsor) }}</p>
              <p class="truncate font-mono text-xs text-muted-foreground">{{ editingSponsor?.id }}</p>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="admin-sponsor-name">{{ t("adminSponsors.edit.name") }}</Label>
              <Input id="admin-sponsor-name" v-model="form.name" />
            </div>
            <div class="space-y-2">
              <Label for="admin-sponsor-avatar">{{ t("adminSponsors.edit.avatar") }}</Label>
              <Input id="admin-sponsor-avatar" v-model="form.avatar" placeholder="https://example.com/avatar.png" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="admin-sponsor-plan">{{ t("adminSponsors.edit.planName") }}</Label>
              <Input id="admin-sponsor-plan" v-model="form.planName" />
            </div>
            <div class="space-y-2">
              <Label for="admin-sponsor-source">{{ t("adminSponsors.edit.source") }}</Label>
              <Input id="admin-sponsor-source" v-model="form.source" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="admin-sponsor-paid-at">{{ t("adminSponsors.edit.paidAt") }}</Label>
              <Input id="admin-sponsor-paid-at" v-model="form.paidAt" type="datetime-local" />
            </div>
            <div class="space-y-2">
              <Label for="admin-sponsor-expires-at">{{ t("adminSponsors.edit.planExpiresAt") }}</Label>
              <Input id="admin-sponsor-expires-at" v-model="form.planExpiresAt" type="datetime-local" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="admin-sponsor-message">{{ t("adminSponsors.edit.message") }}</Label>
            <textarea
              id="admin-sponsor-message"
              v-model="form.message"
              rows="3"
              class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div class="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
            <div class="flex items-center gap-3">
              <Switch
                id="admin-sponsor-active"
                :model-value="form.isActive"
                @update:model-value="form.isActive = !!$event"
              />
              <Label for="admin-sponsor-active">{{ t("adminSponsors.edit.isActive") }}</Label>
            </div>
            <div class="flex items-center gap-3">
              <Switch
                id="admin-sponsor-afdian-sync"
                :model-value="form.afdianSyncDisabled"
                @update:model-value="form.afdianSyncDisabled = !!$event"
              />
              <div class="space-y-1">
                <Label for="admin-sponsor-afdian-sync">{{ t("adminSponsors.edit.afdianSyncDisabled") }}</Label>
                <p class="text-xs text-muted-foreground">{{ t("adminSponsors.edit.afdianSyncHelp") }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-2 rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 text-sm text-muted-foreground">
            <LucideShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
            <span>{{ t("adminSponsors.edit.manualProfileHint") }}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="saving" @click="editOpen = false">
            {{ t("common.cancel") }}
          </Button>
          <Button :disabled="saving" @click="saveSponsor">
            <LucideLoader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            <LucideSave v-else class="mr-2 h-4 w-4" />
            {{ t("common.save") }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
