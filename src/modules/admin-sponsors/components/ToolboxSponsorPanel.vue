<script setup lang="ts">
/**
 * Toolbox accounts with sponsor access: verified by order or OAuth2, or set
 * by hand. One line per account (who, how the access came about, the ids,
 * the last admin note), with the access editor behind the button on the
 * right. The list is paged by the backend, 20 a page.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Loader2, RefreshCw, Search, UserCog, UserPlus } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { formatLocalizedDateTime } from "@/lib/date-time"
import type { ToolboxSponsorUser } from "@/modules/admin-sponsors/api/toolbox-users"
import { useToolboxSponsors } from "@/modules/admin-sponsors/composables/useToolboxSponsors"

const { t, te } = useI18n()
const { items, total, page, query, loading, error, adding, candidateQuery, candidates, candidateTotal, candidatePage, searching, candidateError, searched, editing, target, access, note, load, openAdd, search, edit, save } = useToolboxSponsors()

const PAGE_SIZE = 20
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

/** A verification method the bundle does not know yet shows its raw value rather than a key. */
function verificationLabel(method: string) {
  const key = `adminSponsors.toolbox.${method}`
  return te(key) ? t(key) : method
}

function setAccess(value: unknown) {
  if (value === "granted" || value === "blocked" || value === "automatic") {
    access.value = value
  }
}

function statusVariant(item: ToolboxSponsorUser) {
  if (item.banned) return "destructive" as const
  return item.eligible ? "emerald" as const : "muted" as const
}

function statusLabel(item: ToolboxSponsorUser) {
  return t(`adminSponsors.toolbox.${item.banned ? "banned" : item.eligible ? "eligible" : "ineligible"}`)
}
</script>

<template>
  <AdminPanel
    :title="t('adminSponsors.toolbox.title')"
    :description="t('adminSponsors.toolbox.description')"
    flush
    data-testid="toolbox-sponsors"
  >
    <template #actions>
      <Button size="sm" @click="openAdd"><UserPlus class="size-4" />{{ t("adminSponsors.toolbox.add") }}</Button>
    </template>

    <div class="@container">
      <form class="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5" @submit.prevent="load(1)">
        <!-- On phones the search field takes its own row so the placeholder stays readable. -->
        <div class="relative min-w-0 flex-1 basis-full @min-[30rem]:basis-52 @min-[40rem]:max-w-sm">
          <Search class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            v-model="query"
            class="h-8 pl-8 pointer-coarse:h-10"
            :maxlength="128"
            :aria-label="t('adminSponsors.toolbox.search')"
            :placeholder="t('adminSponsors.toolbox.searchHint')"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" class="pointer-coarse:h-10" :disabled="loading">{{ t("adminSponsors.toolbox.search") }}</Button>
        <Button
          variant="outline"
          size="icon"
          type="button"
          class="size-8 pointer-coarse:size-10"
          :disabled="loading"
          :title="t('adminSponsors.actions.refresh')"
          :aria-label="t('adminSponsors.actions.refresh')"
          @click="load()"
        >
          <RefreshCw :class="['size-4', loading ? 'animate-spin' : '']" />
        </Button>
      </form>

      <p v-if="loading" role="status" class="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <Loader2 class="size-4 animate-spin" />{{ t("adminSponsors.toolbox.loading") }}
      </p>
      <LoadErrorState v-else-if="error" :description="error.message" :detail="error.detail" @retry="load()" />
      <p v-else-if="!items.length" class="px-4 py-8 text-center text-sm text-muted-foreground">{{ t("adminSponsors.toolbox.empty") }}</p>
      <ul v-else class="divide-y divide-border/60" role="list">
        <li
          v-for="item in items"
          :key="item.userId"
          class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1.5 px-4 py-2.5 @min-[52rem]:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_auto]"
          :data-testid="`sponsor-user-${item.userId}`"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{{ item.name }}</span>
              <Badge :variant="statusVariant(item)" size="sm">{{ statusLabel(item) }}</Badge>
              <Badge v-if="item.accessOverride" variant="outline" size="sm">{{ t(`adminSponsors.toolbox.${item.accessOverride}`) }}</Badge>
              <Badge v-if="item.verificationMethod" variant="outline" size="sm">{{ verificationLabel(item.verificationMethod) }}</Badge>
            </div>
            <p class="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminSponsors.toolbox.userId", { id: item.userId }) }} · {{ item.email }}
            </p>
            <p v-if="item.afdianUserId" class="text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminSponsors.toolbox.afdianId", { id: item.afdianUserId }) }}
            </p>
          </div>
          <!-- The last admin note: beside the account on a wide panel, under it otherwise. -->
          <div
            v-if="item.note || item.updatedAt"
            class="col-span-2 row-start-2 min-w-0 @min-[52rem]:col-span-1 @min-[52rem]:col-start-2 @min-[52rem]:row-start-1"
          >
            <p v-if="item.note" class="text-xs whitespace-pre-wrap [overflow-wrap:anywhere]">{{ item.note }}</p>
            <p v-if="item.updatedAt" class="text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("adminSponsors.toolbox.updated", { actor: item.updatedBy, date: formatLocalizedDateTime(item.updatedAt, "dateTime") }) }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="col-start-2 row-start-1 size-8 text-muted-foreground pointer-coarse:size-10 @min-[52rem]:col-start-3"
            :title="t('adminSponsors.toolbox.manage')"
            :aria-label="t('adminSponsors.toolbox.manage')"
            @click="edit(item)"
          >
            <UserCog class="size-4" />
          </Button>
        </li>
      </ul>
    </div>

    <template v-if="!loading && !error" #footer>
      <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span class="tabular-nums text-muted-foreground">{{ t("admin.pagination.total", { total }) }}</span>
        <!-- One page needs no pager. -->
        <div v-if="total > PAGE_SIZE" class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1" @click="load(page - 1)">{{ t("admin.pagination.prevPage") }}</Button>
          <span class="tabular-nums">{{ page }} / {{ pageCount }}</span>
          <Button variant="outline" size="sm" :disabled="page >= pageCount" @click="load(page + 1)">{{ t("admin.pagination.nextPage") }}</Button>
        </div>
      </div>
    </template>
  </AdminPanel>

  <Dialog v-model:open="adding">
    <DialogContent>
      <DialogHeader><DialogTitle>{{ t("adminSponsors.toolbox.add") }}</DialogTitle><DialogDescription>{{ t("adminSponsors.toolbox.addDescription") }}</DialogDescription></DialogHeader>
      <!-- The search stays put while the matches scroll under it. -->
      <form class="flex shrink-0 gap-2 border-b border-border/60 px-4 py-3 sm:px-5" @submit.prevent="search()">
        <Input v-model="candidateQuery" class="min-w-0 flex-1" :maxlength="128" :aria-label="t('adminSponsors.toolbox.findUser')" :placeholder="t('adminSponsors.toolbox.searchHint')" />
        <Button type="submit" class="shrink-0" :disabled="searching || !candidateQuery.trim()">{{ t("adminSponsors.toolbox.search") }}</Button>
      </form>
      <DialogBody>
        <p v-if="candidateError" role="alert" class="text-sm text-destructive">{{ candidateError }}</p>
        <p v-if="searching" role="status" class="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 class="size-4 animate-spin" />{{ t("adminSponsors.toolbox.loading") }}
        </p>
        <p v-else-if="searched && !candidates.length" class="text-sm text-muted-foreground">{{ t("adminSponsors.toolbox.noUser") }}</p>
        <ul v-if="candidates.length" class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-muted/20" role="list">
          <li v-for="user in candidates" :key="user.userId" class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <div class="min-w-0 flex-1 basis-48">
              <p class="text-sm font-medium [overflow-wrap:anywhere]">{{ user.name }}</p>
              <p class="text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ user.userId }} · {{ user.email }}</p>
            </div>
            <Button size="sm" class="ml-auto shrink-0" :variant="user.banned ? 'outline' : 'default'" :disabled="user.banned || searching" @click="edit(user, true)">
              {{ t(user.banned ? 'adminSponsors.toolbox.banned' : 'adminSponsors.toolbox.select') }}
            </Button>
          </li>
        </ul>
        <div v-if="candidateTotal > 20" class="flex justify-end gap-2">
          <Button variant="outline" size="sm" :disabled="searching || candidatePage <= 1" @click="search(candidatePage - 1)">{{ t("admin.pagination.prevPage") }}</Button>
          <Button variant="outline" size="sm" :disabled="searching || candidatePage * 20 >= candidateTotal" @click="search(candidatePage + 1)">{{ t("admin.pagination.nextPage") }}</Button>
        </div>
      </DialogBody>
    </DialogContent>
  </Dialog>

  <ConfirmDialog v-model:open="editing" :title="t('adminSponsors.toolbox.manage')" :description="t('adminSponsors.toolbox.target', { name: target?.name, id: target?.userId })" :confirm-label="t('adminSponsors.toolbox.save')" :destructive="access === 'blocked'" :on-confirm="save">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5 [&_[data-slot=native-select-wrapper]]:w-full">
        <Label for="toolbox-sponsor-access">{{ t("adminSponsors.toolbox.access") }}</Label>
        <NativeSelect id="toolbox-sponsor-access" :model-value="access" class="w-full" @update:model-value="setAccess">
          <NativeSelectOption value="granted" :disabled="target?.banned">{{ t("adminSponsors.toolbox.granted") }}</NativeSelectOption>
          <NativeSelectOption value="blocked">{{ t("adminSponsors.toolbox.blocked") }}</NativeSelectOption>
          <NativeSelectOption value="automatic">{{ t("adminSponsors.toolbox.automatic") }}</NativeSelectOption>
        </NativeSelect>
        <p class="text-xs leading-relaxed text-muted-foreground">{{ t(`adminSponsors.toolbox.${access}Help`) }}</p>
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="toolbox-sponsor-note">{{ t("adminSponsors.toolbox.note") }}</Label>
        <textarea
          id="toolbox-sponsor-note"
          v-model="note"
          class="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          rows="3"
          :maxlength="1000"
          :placeholder="t('adminSponsors.toolbox.noteHint')"
        />
      </div>
    </div>
  </ConfirmDialog>
</template>
