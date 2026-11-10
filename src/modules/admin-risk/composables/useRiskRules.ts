import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { getRiskRules, updateRiskRules } from "@/modules/admin-risk/api/rule"
import type { RiskRuleItem } from "@/modules/admin-risk/api/types"
import {
  diffRiskRules,
  formatRiskRules,
  mergeSavedRiskRules,
  parseRiskRules,
  type RiskRulesDiff,
} from "@/modules/admin-risk/lib/rules"

export function useRiskRules() {
  const userStore = useUserStore()
  const { t } = useI18n()

  const rulesLoading = ref(true)
  const rulesLoadError = ref<ErrorDescription | null>(null)
  /** The rules as stored on the server. */
  const rules = ref<RiskRuleItem[]>([])
  const rulesJson = ref("")
  const rulesSaving = ref(false)

  // Validated while typing: the editor shows the first problem inline and the
  // save button stays disabled until the text is a valid rule array again.
  const rulesParse = computed(() => parseRiskRules(rulesJson.value))
  const rulesError = computed(() => {
    const result = rulesParse.value
    if (result.ok) return null
    const { error } = result
    switch (error.kind) {
      case "invalidRule":
        return t("adminRisk.rules.validation.invalidRule", { index: error.index })
      case "duplicateKey":
        return t("adminRisk.rules.validation.duplicateKey", { index: error.index, key: error.key })
      case "tooMany":
        return t("adminRisk.rules.validation.tooMany", { max: error.max })
      default:
        return t(`adminRisk.rules.validation.${error.kind}`)
    }
  })
  /** What saving the text would do; null while the text is invalid. */
  const rulesDiff = computed<RiskRulesDiff | null>(() =>
    rulesParse.value.ok ? diffRiskRules(rules.value, rulesParse.value.rules) : null
  )
  const savedText = computed(() => formatRiskRules(rules.value))
  /** The text differs from the stored rules as loaded (even if only in spacing). */
  const rulesEdited = computed(() => rulesJson.value !== savedText.value)
  const pendingChanges = computed(() => (rulesDiff.value ? rulesDiff.value.added + rulesDiff.value.changed : 0))

  async function loadRules() {
    rulesLoading.value = true
    rulesLoadError.value = null
    try {
      rules.value = await getRiskRules()
      rulesJson.value = formatRiskRules(rules.value)
    } catch (error: unknown) {
      rulesLoadError.value = describeError(error, t("adminRisk.toast.loadFailedFallback"))
    } finally {
      rulesLoading.value = false
    }
  }

  function revertRules() {
    rulesJson.value = savedText.value
  }

  /** Re-indents a valid text; the stored rules are not touched. */
  function formatRulesText() {
    if (rulesParse.value.ok) rulesJson.value = formatRiskRules(rulesParse.value.rules)
  }

  async function saveRules() {
    const diff = rulesDiff.value
    if (!diff || rulesSaving.value) return
    // Only what changes is sent: an untouched rule keeps its "updated by".
    const changed = diff.entries.filter((entry) => entry.change !== "unchanged").map((entry) => entry.rule)
    if (changed.length === 0) return

    rulesSaving.value = true
    try {
      const updated = await updateRiskRules(changed)
      toast.success(t("adminRisk.toast.rulesUpdated"))
      if (updated.length > 0) {
        rules.value = mergeSavedRiskRules(rules.value, updated)
        rulesJson.value = formatRiskRules(rules.value)
      } else {
        await loadRules()
      }
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminRisk.toast.saveFailedTitle"),
        error,
        t("adminRisk.toast.saveFailedFallback")
      )
    } finally {
      rulesSaving.value = false
    }
  }

  function formatDate(value?: string | null) {
    return formatLocalizedDateTime(value, "dateTime", t("adminRisk.common.fallback"))
  }

  onMounted(() => {
    if (userStore.isSuperAdmin) {
      void loadRules()
    } else {
      rulesLoading.value = false
    }
  })

  return {
    userStore,
    rulesLoading,
    rulesLoadError,
    rules,
    rulesJson,
    rulesError,
    rulesDiff,
    rulesEdited,
    pendingChanges,
    rulesSaving,
    loadRules,
    saveRules,
    revertRules,
    formatRulesText,
    formatDate,
  }
}
