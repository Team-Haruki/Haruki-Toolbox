<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Copy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import ClientConfigAccessSection from "@/modules/client-config-generator/components/ClientConfigAccessSection.vue"
import ClientConfigAdvancedSection from "@/modules/client-config-generator/components/ClientConfigAdvancedSection.vue"
import ClientConfigBasicsSection from "@/modules/client-config-generator/components/ClientConfigBasicsSection.vue"
import ClientConfigBehaviourSection from "@/modules/client-config-generator/components/ClientConfigBehaviourSection.vue"
import ClientConfigModulesSection from "@/modules/client-config-generator/components/ClientConfigModulesSection.vue"
import ClientConfigOutput from "@/modules/client-config-generator/components/ClientConfigOutput.vue"
import { provideClientConfigForm } from "@/modules/client-config-generator/composables/useClientConfigForm"

const { t } = useI18n()
const { resetForm, copyYaml } = provideClientConfigForm()

const resetOpen = ref(false)
const outputAnchor = ref<HTMLElement | null>(null)

function showOutput() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  outputAnchor.value?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="@container mx-auto grid w-full max-w-6xl gap-4">
      <PageHeader :title="t('tools.clientConfigGenerator.title')" :description="t('tools.clientConfigGenerator.lead')">
        <template #actions>
          <Button type="button" variant="outline" data-testid="client-config-reset" @click="resetOpen = true">
            {{ t("tools.clientConfigGenerator.actions.reset") }}
          </Button>
        </template>
      </PageHeader>

      <div class="grid items-start gap-4 @min-[60rem]:grid-cols-[minmax(0,1fr)_24rem]">
        <!-- The form: what every setup fills in first, the rarely changed options folded last -->
        <form class="grid min-w-0 gap-4" novalidate data-testid="client-config-form" @submit.prevent>
          <ClientConfigBasicsSection />
          <ClientConfigBehaviourSection />
          <ClientConfigModulesSection />
          <ClientConfigAccessSection />
          <ClientConfigAdvancedSection />
        </form>

        <!-- The file, beside the form when there is room -->
        <aside ref="outputAnchor" class="min-w-0 scroll-mt-17 @min-[60rem]:sticky @min-[60rem]:top-17">
          <ClientConfigOutput />
        </aside>
      </div>

      <!-- Stacked layout: the file sits under a long form, so copying stays in reach. -->
      <div
        class="sticky bottom-0 z-10 -mx-5 flex items-center gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur sm:-mx-4 sm:px-4 @min-[60rem]:hidden"
        data-page-bottom-bar
        data-testid="client-config-bottom-bar"
      >
        <Button type="button" variant="outline" class="flex-1" @click="showOutput">
          {{ t("tools.clientConfigGenerator.actions.viewOutput") }}
        </Button>
        <Button type="button" class="flex-1" @click="copyYaml">
          <Copy class="size-4" aria-hidden="true" />
          {{ t("tools.clientConfigGenerator.actions.copy") }}
        </Button>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="resetOpen"
      destructive
      :title="t('tools.clientConfigGenerator.resetDialog.title')"
      :description="t('tools.clientConfigGenerator.resetDialog.description')"
      :confirm-label="t('tools.clientConfigGenerator.actions.reset')"
      :on-confirm="resetForm"
    />
  </div>
</template>
