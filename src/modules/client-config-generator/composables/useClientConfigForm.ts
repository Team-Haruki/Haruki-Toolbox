import { computed, inject, provide, reactive, watch, type InjectionKey } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { copyTextToClipboard } from "@/lib/clipboard"
import {
  cloneDefaultClientConfigForm,
  resolveClientConfigPrefillParams,
} from "@/modules/client-config-generator/lib/client-config"
import {
  countAdvancedChanges,
  findMissingEssentials,
  isPrefillStillApplied,
  resolveRoutingState,
} from "@/modules/client-config-generator/lib/config-review"
import {
  buildClientConfigFromRows,
  createDefaultClientConfigRows,
  resetClientConfigRows,
} from "@/modules/client-config-generator/lib/config-rows"

const CONFIG_FILE_NAME = "configs.yaml"

/** The multi-line fields of the form, styled like the shared `Input`. */
export const CLIENT_CONFIG_TEXTAREA_CLASS = "min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"

function createClientConfigForm() {
  const { t } = useI18n()
  const route = useRoute()

  const form = reactive(cloneDefaultClientConfigForm())
  const rows = reactive(createDefaultClientConfigRows())
  /** What the registration page handed over in the URL; the owner id is shown, never written. */
  const queryPrefill = reactive({
    ownerId: "",
    botId: "",
    hasCredential: false,
  })

  const generated = computed(() => buildClientConfigFromRows(form, rows))
  const counts = computed(() => ({
    modules: generated.value.parsed.enableModules.length,
    admins: generated.value.parsed.botAdmins.length,
    scopes: Object.keys(generated.value.parsed.featurePolicyModes).length,
  }))
  const routingState = computed(() => resolveRoutingState(form))
  const missingEssentials = computed(() => findMissingEssentials(form))
  const advancedChanges = computed(() => countAdvancedChanges(form))
  const prefillApplied = computed(() => isPrefillStillApplied(route.query, form))

  watch(
    () => route.query,
    (query) => {
      const prefill = resolveClientConfigPrefillParams(query)
      queryPrefill.ownerId = prefill.ownerId
      queryPrefill.botId = prefill.botId === null ? "" : String(prefill.botId)
      queryPrefill.hasCredential = Boolean(prefill.credential)

      if (prefill.botId !== null) {
        form.botId = prefill.botId
      }

      if (prefill.credential) {
        form.credential = prefill.credential
      }
    },
    { immediate: true },
  )

  function resetForm() {
    Object.assign(form, cloneDefaultClientConfigForm())
    resetClientConfigRows(rows)
    toast.success(t("tools.clientConfigGenerator.toast.reset"))
  }

  async function copyYaml() {
    const copied = await copyTextToClipboard(generated.value.yaml)
    if (!copied) {
      toast.error(t("tools.clientConfigGenerator.toast.copyFailed"))
      return
    }

    toast.success(t("tools.clientConfigGenerator.toast.copySuccess"))
  }

  function downloadYaml() {
    const blob = new Blob([generated.value.yaml], { type: "text/yaml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = CONFIG_FILE_NAME
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t("tools.clientConfigGenerator.toast.downloadSuccess"))
  }

  return {
    form,
    rows,
    queryPrefill,
    prefillApplied,
    generated,
    counts,
    routingState,
    missingEssentials,
    advancedChanges,
    resetForm,
    copyYaml,
    downloadYaml,
  }
}

export type ClientConfigFormContext = ReturnType<typeof createClientConfigForm>

const CLIENT_CONFIG_FORM_KEY: InjectionKey<ClientConfigFormContext> = Symbol("client-config-form")

/** The page owns the form; its sections read and edit it through `useClientConfigForm`. */
export function provideClientConfigForm(): ClientConfigFormContext {
  const context = createClientConfigForm()
  provide(CLIENT_CONFIG_FORM_KEY, context)
  return context
}

export function useClientConfigForm(): ClientConfigFormContext {
  const context = inject(CLIENT_CONFIG_FORM_KEY)
  if (!context) {
    throw new Error("useClientConfigForm() needs the generator page above it")
  }
  return context
}
