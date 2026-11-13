<script setup lang="ts">
/** Group and user lists by scope, and the QQ numbers that may control the client. */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Trash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ClientConfigRowList from "@/modules/client-config-generator/components/ClientConfigRowList.vue"
import ClientConfigScopeSelect from "@/modules/client-config-generator/components/ClientConfigScopeSelect.vue"
import ClientConfigSection from "@/modules/client-config-generator/components/ClientConfigSection.vue"
import { useClientConfigForm } from "@/modules/client-config-generator/composables/useClientConfigForm"
import {
  createAccessIdRow,
  createScopedAccessRow,
  removeRow,
  type ScopedAccessListKey,
} from "@/modules/client-config-generator/lib/config-rows"

const { t } = useI18n()
const { rows } = useClientConfigForm()

const editors = computed<{ key: ScopedAccessListKey; label: string; valueLabel: string }[]>(() => [
  {
    key: "blacklists",
    label: t("tools.clientConfigGenerator.fields.blacklists.label"),
    valueLabel: t("tools.clientConfigGenerator.accessEditor.groupIdLabel"),
  },
  {
    key: "whitelists",
    label: t("tools.clientConfigGenerator.fields.whitelists.label"),
    valueLabel: t("tools.clientConfigGenerator.accessEditor.groupIdLabel"),
  },
  {
    key: "userBlacklists",
    label: t("tools.clientConfigGenerator.fields.userBlacklists.label"),
    valueLabel: t("tools.clientConfigGenerator.accessEditor.userIdLabel"),
  },
])
</script>

<template>
  <ClientConfigSection :title="t('tools.clientConfigGenerator.sections.access.title')">
    <div class="grid gap-x-6 gap-y-5 @min-[40rem]:grid-cols-2">
      <ClientConfigRowList
        v-for="editor in editors"
        :key="editor.key"
        :label="editor.label"
        :add-label="t('tools.clientConfigGenerator.actions.addAccessRow')"
        :data-testid="`client-config-${editor.key}`"
        @add="rows[editor.key].push(createScopedAccessRow())"
      >
        <div
          v-for="row in rows[editor.key]"
          :key="row.key"
          class="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_auto] items-center gap-2"
          data-testid="client-config-access-row"
        >
          <ClientConfigScopeSelect v-model="row.scope" />
          <Input
            v-model="row.value"
            class="tabular-nums"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            :aria-label="editor.valueLabel"
            :placeholder="editor.valueLabel"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-muted-foreground"
            :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
            @click="removeRow(rows[editor.key], row.key, () => createScopedAccessRow())"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </ClientConfigRowList>

      <ClientConfigRowList
        :label="t('tools.clientConfigGenerator.fields.botAdmins.label')"
        :help="t('tools.clientConfigGenerator.fields.botAdmins.help')"
        :add-label="t('tools.clientConfigGenerator.actions.addBotAdmin')"
        data-testid="client-config-admins"
        @add="rows.botAdmins.push(createAccessIdRow())"
      >
        <div
          v-for="row in rows.botAdmins"
          :key="row.key"
          class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          data-testid="client-config-admin-row"
        >
          <Input
            v-model="row.value"
            class="tabular-nums"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            :aria-label="t('tools.clientConfigGenerator.fields.botAdmins.label')"
            :placeholder="t('tools.clientConfigGenerator.accessEditor.botAdminPlaceholder')"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-muted-foreground"
            :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
            @click="removeRow(rows.botAdmins, row.key, () => createAccessIdRow())"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </ClientConfigRowList>
    </div>
  </ClientConfigSection>
</template>
