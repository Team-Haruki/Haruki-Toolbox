<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Loader2, UserPlus } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogDescription, DialogHeader, DialogScrollContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { useToolboxSponsors } from "@/modules/admin-sponsors/composables/useToolboxSponsors"

const { t } = useI18n()
const { items, total, page, query, loading, error, adding, candidateQuery, candidates, candidateTotal, candidatePage, searching, candidateError, searched, editing, target, access, note, load, openAdd, search, edit, save } = useToolboxSponsors()
</script>

<template>
  <Card data-testid="toolbox-sponsors">
    <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0 space-y-1">
        <CardTitle class="text-base">{{ t("adminSponsors.toolbox.title") }}</CardTitle>
        <CardDescription>{{ t("adminSponsors.toolbox.description") }}</CardDescription>
      </div>
      <Button class="w-full shrink-0 self-start sm:w-auto" size="sm" @click="openAdd"><UserPlus class="mr-2 size-4" />{{ t("adminSponsors.toolbox.add") }}</Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <form class="flex flex-wrap gap-2" @submit.prevent="load(1)">
        <Input v-model="query" class="min-w-0 flex-1 basis-48" :maxlength="128" :aria-label="t('adminSponsors.toolbox.search')" :placeholder="t('adminSponsors.toolbox.searchHint')" />
        <Button type="submit" variant="outline" :disabled="loading">{{ t("adminSponsors.toolbox.search") }}</Button>
        <Button variant="ghost" type="button" :disabled="loading" @click="load()">{{ t("adminSponsors.actions.refresh") }}</Button>
      </form>
      <p v-if="loading" role="status" class="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 class="size-4 animate-spin" />{{ t("adminSponsors.toolbox.loading") }}</p>
      <LoadErrorState v-else-if="error" :description="error.message" :detail="error.detail" @retry="load()" />
      <template v-else>
        <p v-if="!items.length" class="py-4 text-center text-sm text-muted-foreground">{{ t("adminSponsors.toolbox.empty") }}</p>
        <div v-for="item in items" :key="item.userId" class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start" :data-testid="`sponsor-user-${item.userId}`">
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="break-all font-medium">{{ item.name }}</span>
              <Badge :variant="item.eligible ? 'default' : 'secondary'">{{ t(`adminSponsors.toolbox.${item.banned ? 'banned' : item.eligible ? 'eligible' : 'ineligible'}`) }}</Badge>
              <Badge v-if="item.accessOverride" variant="outline">{{ t(`adminSponsors.toolbox.${item.accessOverride}`) }}</Badge>
              <Badge v-if="item.verificationMethod" variant="outline">{{ t(`adminSponsors.toolbox.${item.verificationMethod}`) }}</Badge>
            </div>
            <p class="break-all text-xs text-muted-foreground">{{ t("adminSponsors.toolbox.userId", { id: item.userId }) }} · {{ item.email }}</p>
            <p v-if="item.afdianUserId" class="break-all text-xs text-muted-foreground">{{ t("adminSponsors.toolbox.afdianId", { id: item.afdianUserId }) }}</p>
            <p v-if="item.note" class="whitespace-pre-wrap break-words text-sm">{{ item.note }}</p>
            <p v-if="item.updatedAt" class="break-all text-xs text-muted-foreground">{{ t("adminSponsors.toolbox.updated", { actor: item.updatedBy, date: formatLocalizedDateTime(item.updatedAt) }) }}</p>
          </div>
          <Button variant="outline" size="sm" class="self-start" @click="edit(item)">{{ t("adminSponsors.toolbox.manage") }}</Button>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span class="text-muted-foreground">{{ t("admin.pagination.total", { total }) }}</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" :disabled="page <= 1" @click="load(page - 1)">{{ t("admin.pagination.prevPage") }}</Button>
            <span>{{ page }}</span>
            <Button variant="outline" size="sm" :disabled="page * 20 >= total" @click="load(page + 1)">{{ t("admin.pagination.nextPage") }}</Button>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>

  <Dialog v-model:open="adding">
    <DialogScrollContent class="sm:max-w-xl">
      <DialogHeader><DialogTitle>{{ t("adminSponsors.toolbox.add") }}</DialogTitle><DialogDescription>{{ t("adminSponsors.toolbox.addDescription") }}</DialogDescription></DialogHeader>
      <form class="flex gap-2" @submit.prevent="search()">
        <Input v-model="candidateQuery" :maxlength="128" :aria-label="t('adminSponsors.toolbox.findUser')" :placeholder="t('adminSponsors.toolbox.searchHint')" />
        <Button type="submit" :disabled="searching || !candidateQuery.trim()">{{ t("adminSponsors.toolbox.search") }}</Button>
      </form>
      <p v-if="candidateError" role="alert" class="text-sm text-destructive">{{ candidateError }}</p>
      <p v-if="searching" role="status" class="text-sm text-muted-foreground">{{ t("adminSponsors.toolbox.loading") }}</p>
      <p v-else-if="searched && !candidates.length" class="text-sm text-muted-foreground">{{ t("adminSponsors.toolbox.noUser") }}</p>
      <div v-for="user in candidates" :key="user.userId" class="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <div class="min-w-0 flex-1 basis-48"><p class="break-all font-medium">{{ user.name }}</p><p class="break-all text-xs text-muted-foreground">{{ user.userId }} · {{ user.email }}</p></div>
        <Button size="sm" :disabled="user.banned || searching" @click="edit(user, true)">{{ t(user.banned ? 'adminSponsors.toolbox.banned' : 'adminSponsors.toolbox.select') }}</Button>
      </div>
      <div v-if="candidateTotal > 20" class="flex justify-end gap-2">
        <Button variant="outline" size="sm" :disabled="searching || candidatePage <= 1" @click="search(candidatePage - 1)">{{ t("admin.pagination.prevPage") }}</Button>
        <Button variant="outline" size="sm" :disabled="searching || candidatePage * 20 >= candidateTotal" @click="search(candidatePage + 1)">{{ t("admin.pagination.nextPage") }}</Button>
      </div>
    </DialogScrollContent>
  </Dialog>

  <ConfirmDialog v-model:open="editing" :title="t('adminSponsors.toolbox.manage')" :description="t('adminSponsors.toolbox.target', { name: target?.name, id: target?.userId })" :confirm-label="t('adminSponsors.toolbox.save')" :destructive="access === 'blocked'" :on-confirm="save">
    <div class="space-y-3">
      <div class="space-y-2">
        <Label for="toolbox-sponsor-access">{{ t("adminSponsors.toolbox.access") }}</Label>
        <select id="toolbox-sponsor-access" v-model="access" class="h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="granted" :disabled="target?.banned">{{ t("adminSponsors.toolbox.granted") }}</option>
          <option value="blocked">{{ t("adminSponsors.toolbox.blocked") }}</option>
          <option value="automatic">{{ t("adminSponsors.toolbox.automatic") }}</option>
        </select>
        <p class="text-xs leading-relaxed text-muted-foreground">{{ t(`adminSponsors.toolbox.${access}Help`) }}</p>
      </div>
      <div class="space-y-2">
        <Label for="toolbox-sponsor-note">{{ t("adminSponsors.toolbox.note") }}</Label>
        <textarea id="toolbox-sponsor-note" class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" rows="3" v-model="note" :maxlength="1000" :placeholder="t('adminSponsors.toolbox.noteHint')" />
      </div>
    </div>
  </ConfirmDialog>
</template>
