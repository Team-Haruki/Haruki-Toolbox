<script setup lang="ts">
/** Which command modules run, and which single features get their own list mode. */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Trash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import SimpleSelect from "@/shared/components/SimpleSelect.vue"
import ClientConfigRowList from "@/modules/client-config-generator/components/ClientConfigRowList.vue"
import ClientConfigSection from "@/modules/client-config-generator/components/ClientConfigSection.vue"
import { useClientConfigForm } from "@/modules/client-config-generator/composables/useClientConfigForm"
import {
  CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS,
  CLIENT_CONFIG_MODULE_OPTIONS,
} from "@/modules/client-config-generator/lib/client-config"
import {
  appendModuleRow,
  createFeaturePolicyRow,
  createModuleRow,
  isFeatureScopeOption,
  normalizeRunMode,
  removeRow,
  selectModule,
} from "@/modules/client-config-generator/lib/config-rows"

const { t } = useI18n()
const { rows } = useClientConfigForm()

const moduleOptions = computed(() => CLIENT_CONFIG_MODULE_OPTIONS.map((value) => ({
  value,
  label: value === "all"
    ? t("tools.clientConfigGenerator.moduleSelector.allModules")
    : t("tools.clientConfigGenerator.moduleSelector.moduleOption", { value }),
})))

const featureScopeOptions = CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.map((value) => ({ value, label: value }))

const modeOptions = computed(() => [
  { value: "blacklist", label: t("tools.clientConfigGenerator.runMode.blacklist") },
  { value: "whitelist", label: t("tools.clientConfigGenerator.runMode.whitelist") },
])
</script>

<template>
  <ClientConfigSection :title="t('tools.clientConfigGenerator.sections.modules.title')">
    <div class="grid gap-x-6 gap-y-5 @min-[40rem]:grid-cols-2">
      <ClientConfigRowList
        :label="t('tools.clientConfigGenerator.fields.enableModules.label')"
        :add-label="t('tools.clientConfigGenerator.actions.addModule')"
        data-testid="client-config-modules"
        @add="appendModuleRow(rows.modules)"
      >
        <div
          v-for="row in rows.modules"
          :key="row.key"
          class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          data-testid="client-config-module-row"
        >
          <SimpleSelect
            :model-value="row.module"
            :options="moduleOptions"
            :placeholder="t('tools.clientConfigGenerator.moduleSelector.placeholder')"
            :aria-label="t('tools.clientConfigGenerator.fields.enableModules.label')"
            trigger-class="w-full"
            @update:model-value="selectModule(rows.modules, row, $event)"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-muted-foreground"
            :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
            @click="removeRow(rows.modules, row.key, () => createModuleRow('all'))"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </ClientConfigRowList>

      <ClientConfigRowList
        :label="t('tools.clientConfigGenerator.fields.featurePolicyModes.label')"
        :help="t('tools.clientConfigGenerator.fields.featurePolicyModes.hint')"
        :add-label="t('tools.clientConfigGenerator.actions.addFeaturePolicy')"
        data-testid="client-config-policies"
        @add="rows.featurePolicies.push(createFeaturePolicyRow())"
      >
        <div
          v-for="row in rows.featurePolicies"
          :key="row.key"
          class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"
          data-testid="client-config-policy-row"
        >
          <SimpleSelect
            :model-value="row.scope"
            :options="featureScopeOptions"
            :placeholder="t('tools.clientConfigGenerator.policyEditor.scopePlaceholder')"
            trigger-class="w-full"
            @update:model-value="row.scope = isFeatureScopeOption($event) ? $event : ''"
          />
          <SimpleSelect
            :model-value="row.mode"
            :options="modeOptions"
            :placeholder="t('tools.clientConfigGenerator.policyEditor.modePlaceholder')"
            trigger-class="w-full"
            @update:model-value="row.mode = normalizeRunMode($event)"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="text-muted-foreground"
            :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
            @click="removeRow(rows.featurePolicies, row.key)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </ClientConfigRowList>
    </div>
  </ClientConfigSection>
</template>
