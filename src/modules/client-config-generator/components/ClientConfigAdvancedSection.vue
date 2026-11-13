<script setup lang="ts">
/**
 * The options most setups leave alone, folded by topic: network routing,
 * keys and local security, the global rate limit and the birthday-material
 * push. A closed group still shows how many of its fields were changed.
 * Help text here is kept to what a wrong value would cost.
 */
import { computed, reactive } from "vue"
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ClientConfigFold from "@/modules/client-config-generator/components/ClientConfigFold.vue"
import ClientConfigSection from "@/modules/client-config-generator/components/ClientConfigSection.vue"
import ClientConfigSwitchRow from "@/modules/client-config-generator/components/ClientConfigSwitchRow.vue"
import {
  CLIENT_CONFIG_TEXTAREA_CLASS,
  useClientConfigForm,
} from "@/modules/client-config-generator/composables/useClientConfigForm"
import type { ClientConfigAdvancedGroup } from "@/modules/client-config-generator/lib/config-review"
import { normalizeRunMode } from "@/modules/client-config-generator/lib/config-rows"

const { t } = useI18n()
const { form, routingState, advancedChanges } = useClientConfigForm()

const open = reactive<Record<ClientConfigAdvancedGroup, boolean>>({
  routing: false,
  security: false,
  rateLimit: false,
  birthday: false,
})

const pinnedEndpoint = computed(() => routingState.value === "pinned")
</script>

<template>
  <ClientConfigSection
    :title="t('tools.clientConfigGenerator.sections.advanced.title')"
    :description="t('tools.clientConfigGenerator.sections.advanced.description')"
    data-testid="client-config-advanced"
  >
    <template #flush>
      <div class="divide-y divide-border/60 border-t border-border/60">
        <!-- Network routing -->
        <ClientConfigFold
          v-model:open="open.routing"
          :title="t('tools.clientConfigGenerator.sections.routing.title')"
          :changed="advancedChanges.routing"
          data-fold="routing"
        >
          <p
            class="flex"
            role="status"
            data-testid="client-config-routing-state"
            :data-state="routingState"
          >
            <span
              :class="[
                'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                pinnedEndpoint ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-primary/10 text-primary',
              ]"
            >
              {{ t(`tools.clientConfigGenerator.routingState.${routingState}`) }}
            </span>
          </p>

          <div class="grid gap-1.5">
            <Label for="client-endpoint-override">
              {{ t("tools.clientConfigGenerator.fields.serverEndpointOverride.label") }}
            </Label>
            <Input
              id="client-endpoint-override"
              v-model="form.serverEndpointOverride"
              autocomplete="off"
              spellcheck="false"
              inputmode="url"
              :placeholder="t('tools.clientConfigGenerator.fields.serverEndpointOverride.placeholder')"
            />
          </div>

          <div class="border-y border-border/60">
            <ClientConfigSwitchRow
              id="client-dynamic-routing"
              v-model="form.enableDynamicRouting"
              :label="t('tools.clientConfigGenerator.fields.enableDynamicRouting.label')"
              :help="t('tools.clientConfigGenerator.fields.enableDynamicRouting.help')"
              :disabled="pinnedEndpoint"
            />
          </div>

          <div class="grid gap-1.5">
            <Label for="client-routing-url">
              {{ t("tools.clientConfigGenerator.fields.routingConfigURL.label") }}
            </Label>
            <Input
              id="client-routing-url"
              v-model="form.routingConfigURL"
              autocomplete="off"
              spellcheck="false"
              inputmode="url"
              :disabled="pinnedEndpoint || !form.enableDynamicRouting"
              :placeholder="t('tools.clientConfigGenerator.fields.routingConfigURL.placeholder')"
            />
          </div>
        </ClientConfigFold>

        <!-- Keys and local security -->
        <ClientConfigFold
          v-model:open="open.security"
          :title="t('tools.clientConfigGenerator.sections.security.title')"
          :changed="advancedChanges.security"
          data-fold="security"
        >
          <div class="grid gap-3 @min-[34rem]:grid-cols-2">
            <div class="grid content-start gap-1.5">
              <Label for="client-noise-key">
                {{ t("tools.clientConfigGenerator.fields.noiseServerPubkey.label") }}
              </Label>
              <Input
                id="client-noise-key"
                v-model="form.noiseServerPubkey"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('tools.clientConfigGenerator.fields.noiseServerPubkey.placeholder')"
              />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="client-noise-key-id">
                {{ t("tools.clientConfigGenerator.fields.noiseServerKeyId.label") }}
              </Label>
              <Input
                id="client-noise-key-id"
                v-model="form.noiseServerKeyId"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('tools.clientConfigGenerator.fields.noiseServerKeyId.placeholder')"
              />
            </div>
            <div class="grid content-start gap-1.5 @min-[34rem]:col-span-2">
              <Label for="client-trust-root-key">
                {{ t("tools.clientConfigGenerator.fields.trustRootPubkey.label") }}
              </Label>
              <Input
                id="client-trust-root-key"
                v-model="form.trustRootPubkey"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('tools.clientConfigGenerator.fields.trustRootPubkey.placeholder')"
              />
            </div>
          </div>

          <div class="divide-y divide-border/60 border-y border-border/60">
            <div>
              <ClientConfigSwitchRow
                id="client-use-control-token"
                v-model="form.useControlApiAccessToken"
                :label="t('tools.clientConfigGenerator.fields.controlApiAccessToken.label')"
                :help="t('tools.clientConfigGenerator.fields.controlApiAccessToken.help')"
              />
              <div v-if="form.useControlApiAccessToken" class="pb-3">
                <Input
                  id="client-control-token"
                  v-model="form.controlApiAccessToken"
                  autocomplete="off"
                  spellcheck="false"
                  :aria-label="t('tools.clientConfigGenerator.fields.controlApiAccessToken.label')"
                  :placeholder="t('tools.clientConfigGenerator.fields.controlApiAccessToken.placeholder')"
                />
              </div>
            </div>
            <ClientConfigSwitchRow
              id="client-toggle-strictConfigPermissions"
              v-model="form.strictConfigPermissions"
              :label="t('tools.clientConfigGenerator.toggles.strictConfigPermissions.label')"
              :help="t('tools.clientConfigGenerator.toggles.strictConfigPermissions.help')"
            />
          </div>
        </ClientConfigFold>

        <!-- Global rate limit -->
        <ClientConfigFold
          v-model:open="open.rateLimit"
          :title="t('tools.clientConfigGenerator.sections.rateLimit.title')"
          :changed="advancedChanges.rateLimit"
          data-fold="rateLimit"
        >
          <div class="border-b border-border/60">
            <ClientConfigSwitchRow
              id="client-group-command-limit"
              v-model="form.enableGroupCommandLimit"
              class="pt-0"
              :label="t('tools.clientConfigGenerator.fields.enableGroupCommandLimit.label')"
              :help="t('tools.clientConfigGenerator.fields.enableGroupCommandLimit.help')"
            />
          </div>
          <div class="grid grid-cols-2 gap-3 @min-[34rem]:max-w-md">
            <div class="grid content-start gap-1.5">
              <Label for="client-hour-limit">
                {{ t("tools.clientConfigGenerator.fields.globalCommandHourlyLimit.label") }}
              </Label>
              <Input
                id="client-hour-limit"
                v-model.number="form.globalCommandHourlyLimit"
                class="tabular-nums"
                type="number"
                min="0"
                inputmode="numeric"
              />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="client-day-limit">
                {{ t("tools.clientConfigGenerator.fields.globalCommandDailyLimit.label") }}
              </Label>
              <Input
                id="client-day-limit"
                v-model.number="form.globalCommandDailyLimit"
                class="tabular-nums"
                type="number"
                min="0"
                inputmode="numeric"
              />
            </div>
          </div>
        </ClientConfigFold>

        <!-- Birthday-material push -->
        <ClientConfigFold
          v-model:open="open.birthday"
          :title="t('tools.clientConfigGenerator.sections.birthday.title')"
          :changed="advancedChanges.birthday"
          data-fold="birthday"
        >
          <div class="grid gap-1.5">
            <Label id="client-birthday-monitor-mode-label" for="client-birthday-monitor-mode">
              {{ t("tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorMode.label") }}
            </Label>
            <Select
              id="client-birthday-monitor-mode"
              :model-value="form.mysekaiBirthdayMonitorMode"
              @update:model-value="form.mysekaiBirthdayMonitorMode = normalizeRunMode($event)"
            >
              <SelectTrigger class="w-full @min-[34rem]:w-60" aria-labelledby="client-birthday-monitor-mode-label">
                <SelectValue :placeholder="t('tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorMode.placeholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blacklist">{{ t("tools.clientConfigGenerator.runMode.blacklist") }}</SelectItem>
                <SelectItem value="whitelist">{{ t("tools.clientConfigGenerator.runMode.whitelist") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-3 @min-[34rem]:grid-cols-2">
            <div class="grid content-start gap-1.5">
              <Label for="client-birthday-monitor-blacklist">
                {{ t("tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorBlacklist.label") }}
              </Label>
              <textarea
                id="client-birthday-monitor-blacklist"
                v-model="form.mysekaiBirthdayMonitorBlacklistText"
                inputmode="numeric"
                :placeholder="t('tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorBlacklist.placeholder')"
                :class="CLIENT_CONFIG_TEXTAREA_CLASS"
              />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="client-birthday-monitor-whitelist">
                {{ t("tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorWhitelist.label") }}
              </Label>
              <textarea
                id="client-birthday-monitor-whitelist"
                v-model="form.mysekaiBirthdayMonitorWhitelistText"
                inputmode="numeric"
                :placeholder="t('tools.clientConfigGenerator.fields.mysekaiBirthdayMonitorWhitelist.placeholder')"
                :class="CLIENT_CONFIG_TEXTAREA_CLASS"
              />
            </div>
          </div>

          <div class="border-t border-border/60">
            <ClientConfigSwitchRow
              id="client-toggle-mysekaiBirthdayMonitorNotifyEmpty"
              v-model="form.mysekaiBirthdayMonitorNotifyEmpty"
              class="pb-0"
              :label="t('tools.clientConfigGenerator.toggles.mysekaiBirthdayMonitorNotifyEmpty.label')"
              :help="t('tools.clientConfigGenerator.toggles.mysekaiBirthdayMonitorNotifyEmpty.description')"
            />
          </div>
        </ClientConfigFold>
      </div>
    </template>
  </ClientConfigSection>
</template>
