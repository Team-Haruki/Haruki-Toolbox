<script setup lang="ts">
/** Where the bot answers and how: the run mode, the everyday switches and the help text. */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ClientConfigSection from "@/modules/client-config-generator/components/ClientConfigSection.vue"
import ClientConfigSwitchRow from "@/modules/client-config-generator/components/ClientConfigSwitchRow.vue"
import {
  CLIENT_CONFIG_TEXTAREA_CLASS,
  useClientConfigForm,
} from "@/modules/client-config-generator/composables/useClientConfigForm"
import { normalizeRunMode } from "@/modules/client-config-generator/lib/config-rows"

const { t } = useI18n()
const { form } = useClientConfigForm()

// Only the private-chat switch carries a visible line: it bypasses the group
// lists, which is not what its name suggests. The two jargon-named ones keep
// their explanation in a tooltip.
const toggles = computed(() => [
  {
    key: "enablePrivateMessage" as const,
    label: t("tools.clientConfigGenerator.toggles.enablePrivateMessage.label"),
    help: t("tools.clientConfigGenerator.toggles.enablePrivateMessage.description"),
  },
  { key: "enableReplyMessage" as const, label: t("tools.clientConfigGenerator.toggles.enableReplyMessage.label") },
  { key: "enableHelp" as const, label: t("tools.clientConfigGenerator.toggles.enableHelp.label") },
  { key: "enableCN" as const, label: t("tools.clientConfigGenerator.toggles.enableCN.label") },
  {
    key: "sendBase64Image" as const,
    label: t("tools.clientConfigGenerator.toggles.sendBase64Image.label"),
    hint: t("tools.clientConfigGenerator.toggles.sendBase64Image.description"),
  },
  {
    key: "enableParamEcho" as const,
    label: t("tools.clientConfigGenerator.toggles.enableParamEcho.label"),
    hint: t("tools.clientConfigGenerator.toggles.enableParamEcho.description"),
  },
])
</script>

<template>
  <ClientConfigSection :title="t('tools.clientConfigGenerator.sections.behaviour.title')">
    <div class="grid gap-1.5">
      <Label id="client-run-mode-label" for="client-run-mode">
        {{ t("tools.clientConfigGenerator.fields.runMode.label") }}
      </Label>
      <Select id="client-run-mode" :model-value="form.runMode" @update:model-value="form.runMode = normalizeRunMode($event)">
        <SelectTrigger class="w-full @min-[34rem]:w-60" aria-labelledby="client-run-mode-label" data-testid="client-run-mode">
          <SelectValue :placeholder="t('tools.clientConfigGenerator.fields.runMode.placeholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blacklist">{{ t("tools.clientConfigGenerator.runMode.blacklist") }}</SelectItem>
          <SelectItem value="whitelist">{{ t("tools.clientConfigGenerator.runMode.whitelist") }}</SelectItem>
        </SelectContent>
      </Select>
      <p class="text-xs leading-relaxed text-muted-foreground">{{ t("tools.clientConfigGenerator.fields.runMode.help") }}</p>
    </div>

    <div class="divide-y divide-border/60 border-y border-border/60">
      <ClientConfigSwitchRow
        v-for="item in toggles"
        :id="`client-toggle-${item.key}`"
        :key="item.key"
        v-model="form[item.key]"
        :label="item.label"
        :help="item.help"
        :hint="item.hint"
      />
    </div>

    <div class="grid gap-1.5">
      <Label for="client-help-content">{{ t("tools.clientConfigGenerator.fields.helpContent.label") }}</Label>
      <textarea
        id="client-help-content"
        v-model="form.helpContent"
        :placeholder="t('tools.clientConfigGenerator.fields.helpContent.placeholder')"
        :class="CLIENT_CONFIG_TEXTAREA_CLASS"
      />
    </div>
  </ClientConfigSection>
</template>
