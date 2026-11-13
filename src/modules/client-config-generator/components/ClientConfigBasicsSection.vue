<script setup lang="ts">
/** Who the bot is and where the client listens: the fields every setup fills in. */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FieldError from "@/shared/components/FieldError.vue"
import ClientConfigSection from "@/modules/client-config-generator/components/ClientConfigSection.vue"
import { useClientConfigForm } from "@/modules/client-config-generator/composables/useClientConfigForm"
import { isValidPort } from "@/modules/client-config-generator/lib/config-review"

const { t } = useI18n()
const { form, queryPrefill, prefillApplied } = useClientConfigForm()

const portInvalid = computed(() => !isValidPort(form.port))
const controlPortInvalid = computed(() => !isValidPort(form.controlApiPort, 0))

/** The tag says the values came from registration; the line under it only names whose. */
const prefillOwner = computed(() => (prefillApplied.value ? queryPrefill.ownerId : ""))
</script>

<template>
  <ClientConfigSection :title="t('tools.clientConfigGenerator.sections.basics.title')">
    <template v-if="prefillApplied" #badge>
      <span class="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary" data-testid="client-config-prefill-tag">
        {{ t("tools.clientConfigGenerator.prefill.tag") }}
      </span>
    </template>
    <template v-if="prefillOwner || !prefillApplied" #description>
      <span v-if="prefillOwner" class="[overflow-wrap:anywhere]" data-testid="client-config-prefill">
        {{ t("tools.clientConfigGenerator.prefill.owner", { value: prefillOwner }) }}
      </span>
      <RouterLink
        v-else
        to="/haruki-bot-neo"
        class="font-medium text-primary underline-offset-4 hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-10 pointer-coarse:items-center"
      >
        {{ t("tools.clientConfigGenerator.sections.basics.register") }}
      </RouterLink>
    </template>

    <div class="grid gap-3 @min-[34rem]:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      <div class="grid content-start gap-1.5">
        <Label for="client-bot-id">{{ t("tools.clientConfigGenerator.fields.botId.label") }}</Label>
        <Input
          id="client-bot-id"
          v-model.number="form.botId"
          class="tabular-nums"
          type="number"
          min="0"
          inputmode="numeric"
          :placeholder="t('tools.clientConfigGenerator.fields.botId.placeholder')"
        />
      </div>
      <div class="grid content-start gap-1.5">
        <Label for="client-credential">{{ t("tools.clientConfigGenerator.fields.credential.label") }}</Label>
        <Input
          id="client-credential"
          v-model="form.credential"
          autocomplete="off"
          spellcheck="false"
          :placeholder="t('tools.clientConfigGenerator.fields.credential.placeholder')"
        />
      </div>
    </div>

    <div class="grid gap-3 @min-[34rem]:grid-cols-3">
      <div class="grid content-start gap-1.5">
        <Label for="client-host">{{ t("tools.clientConfigGenerator.fields.host.label") }}</Label>
        <Input
          id="client-host"
          v-model="form.host"
          autocomplete="off"
          spellcheck="false"
          :placeholder="t('tools.clientConfigGenerator.fields.host.placeholder')"
        />
      </div>
      <div class="grid content-start gap-1.5">
        <Label for="client-port">{{ t("tools.clientConfigGenerator.fields.port.label") }}</Label>
        <Input
          id="client-port"
          v-model.number="form.port"
          class="tabular-nums"
          type="number"
          min="1"
          max="65535"
          inputmode="numeric"
          :aria-invalid="portInvalid ? 'true' : undefined"
          :aria-describedby="portInvalid ? 'client-port-error' : undefined"
        />
        <FieldError v-if="portInvalid" id="client-port-error" :message="t('tools.clientConfigGenerator.fields.port.invalid')" />
      </div>
      <div class="grid content-start gap-1.5">
        <Label for="client-control-port">{{ t("tools.clientConfigGenerator.fields.controlApiPort.label") }}</Label>
        <Input
          id="client-control-port"
          v-model.number="form.controlApiPort"
          class="tabular-nums"
          type="number"
          min="0"
          max="65535"
          inputmode="numeric"
          :aria-invalid="controlPortInvalid ? 'true' : undefined"
          :aria-describedby="controlPortInvalid ? 'client-control-port-error' : undefined"
        />
        <FieldError
          v-if="controlPortInvalid"
          id="client-control-port-error"
          :message="t('tools.clientConfigGenerator.fields.controlApiPort.invalid')"
        />
      </div>
    </div>
  </ClientConfigSection>
</template>
