<script setup lang="ts">
/**
 * The public API allowlist as an editable list: every key on a line of its
 * own with a remove button, new keys typed (or pasted, several at once) into
 * the field underneath. Edits stay local until saved: a removed key stays in
 * place struck out with an undo, a new key is marked, and the footer says
 * what a save will change.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2, LucidePlus, LucideSave, LucideUndo2, LucideX } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import FieldError from "@/shared/components/FieldError.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AllowedKeysDraft } from "@/modules/admin-config/lib/allowed-keys"

const props = defineProps<{
  loading: boolean
  loadError: ErrorDescription | null
  /** The list as loaded. */
  keys: readonly string[]
  draft: AllowedKeysDraft
  input: string
  inputError: string | null
  saving: boolean
  dirty: boolean
}>()

const emit = defineEmits<{
  (event: "update:input", value: string): void
  (event: "add"): void
  (event: "remove", key: string): void
  (event: "restore", key: string): void
  (event: "reset"): void
  (event: "save"): void
  (event: "retry"): void
}>()

const { t } = useI18n()

const INPUT_ID = "config-allowed-key-input"
const INPUT_ERROR_ID = `${INPUT_ID}-error`
const INPUT_HINT_ID = `${INPUT_ID}-hint`

type KeyRow = { key: string; state: "kept" | "removed" | "added" }

const rows = computed<KeyRow[]>(() => [
  ...props.keys.map((key): KeyRow => ({ key, state: props.draft.removed.includes(key) ? "removed" : "kept" })),
  ...props.draft.added.map((key): KeyRow => ({ key, state: "added" })),
])

/** How many keys a save leaves on the list. */
const effectiveCount = computed(() => props.keys.length - props.draft.removed.length + props.draft.added.length)

const title = computed(() => props.loading || props.loadError
  ? t("adminConfig.allowedKeys.title")
  : `${t("adminConfig.allowedKeys.title")} · ${t("adminConfig.allowedKeys.count", { count: effectiveCount.value })}`)

const ROW_CLASS: Record<KeyRow["state"], string> = {
  kept: "bg-muted/50",
  added: "bg-emerald-500/10",
  removed: "bg-muted/30 text-muted-foreground",
}
</script>

<template>
  <SettingsGroup :title="title" surface="card" data-testid="config-allowed-keys">
    <template #action>
      <Badge v-if="dirty" variant="amber" size="sm" role="status">
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ t("adminConfig.unsavedChanges") }}
      </Badge>
    </template>

    <div v-if="loading" class="flex flex-col gap-2 px-4 py-3">
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-24 w-full" />
    </div>
    <LoadErrorState
      v-else-if="loadError"
      :title="t('adminConfig.loadError')"
      :description="loadError.message"
      :detail="loadError.detail"
      :retrying="loading"
      @retry="emit('retry')"
    />
    <template v-else>
      <div class="px-4 py-3">
        <p class="text-xs text-muted-foreground">{{ t("adminConfig.allowedKeys.help") }}</p>
        <p v-if="rows.length === 0" class="mt-3 rounded-md bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
          {{ t("adminConfig.allowedKeys.empty") }}
        </p>
        <ul v-else class="mt-3 grid gap-1.5 @min-[30rem]:grid-cols-2 @min-[50rem]:grid-cols-3" role="list">
          <li
            v-for="row in rows"
            :key="row.key"
            :class="['flex min-w-0 items-center gap-2 rounded-md py-0.5 pr-0.5 pl-2.5', ROW_CLASS[row.state]]"
            :data-key="row.key"
            :data-state="row.state"
          >
            <span
              :class="['min-w-0 flex-1 font-mono text-[13px] leading-5 [overflow-wrap:anywhere]', row.state === 'removed' ? 'line-through' : '']"
            >
              {{ row.key }}
            </span>
            <Badge v-if="row.state === 'added'" variant="emerald" size="sm">{{ t("adminConfig.allowedKeys.addedMark") }}</Badge>
            <Badge v-else-if="row.state === 'removed'" variant="muted" size="sm">{{ t("adminConfig.allowedKeys.removedMark") }}</Badge>
            <Button
              v-if="row.state === 'removed'"
              type="button"
              variant="ghost"
              size="icon"
              class="size-7 shrink-0 text-muted-foreground pointer-coarse:size-10"
              :disabled="saving"
              :title="t('adminConfig.allowedKeys.restore', { key: row.key })"
              :aria-label="t('adminConfig.allowedKeys.restore', { key: row.key })"
              @click="emit('restore', row.key)"
            >
              <LucideUndo2 class="size-3.5" />
            </Button>
            <Button
              v-else
              type="button"
              variant="ghost"
              size="icon"
              class="size-7 shrink-0 text-muted-foreground hover:text-destructive pointer-coarse:size-10"
              :disabled="saving"
              :title="t('adminConfig.allowedKeys.remove', { key: row.key })"
              :aria-label="t('adminConfig.allowedKeys.remove', { key: row.key })"
              @click="emit('remove', row.key)"
            >
              <LucideX class="size-3.5" />
            </Button>
          </li>
        </ul>
      </div>

      <form class="flex flex-wrap items-start gap-2 px-4 py-3" novalidate @submit.prevent="emit('add')">
        <div class="min-w-0 flex-1 basis-52">
          <Input
            :id="INPUT_ID"
            :model-value="input"
            class="font-mono text-[13px]"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
            :disabled="saving"
            :aria-label="t('adminConfig.allowedKeys.addLabel')"
            :placeholder="t('adminConfig.allowedKeys.addPlaceholder')"
            :aria-invalid="inputError ? true : undefined"
            :aria-describedby="inputError ? INPUT_ERROR_ID : INPUT_HINT_ID"
            @update:model-value="emit('update:input', String($event ?? ''))"
          />
          <FieldError :id="INPUT_ERROR_ID" class="mt-1.5" :message="inputError" />
          <p v-if="!inputError" :id="INPUT_HINT_ID" class="mt-1.5 text-xs text-muted-foreground">
            {{ t("adminConfig.allowedKeys.addHint") }}
          </p>
        </div>
        <Button type="submit" variant="outline" :disabled="saving">
          <LucidePlus class="size-4" />
          {{ t("adminConfig.allowedKeys.add") }}
        </Button>
      </form>
    </template>

    <template v-if="!loading && !loadError" #footer>
      <span v-if="dirty" class="mr-auto self-center text-xs tabular-nums text-muted-foreground">
        {{ t("adminConfig.allowedKeys.pending", { added: draft.added.length, removed: draft.removed.length }) }}
      </span>
      <Button variant="outline" :disabled="saving || !dirty" @click="emit('reset')">
        {{ t("adminConfig.allowedKeys.reset") }}
      </Button>
      <Button :disabled="saving || !dirty" @click="emit('save')">
        <LucideLoader2 v-if="saving" class="size-4 animate-spin" />
        <LucideSave v-else class="size-4" />
        {{ t("common.save") }}
      </Button>
    </template>
  </SettingsGroup>
</template>
