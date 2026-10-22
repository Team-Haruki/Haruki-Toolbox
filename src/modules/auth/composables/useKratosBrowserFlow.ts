import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { createLogger } from "@/lib/logger"
import {
  fetchKratosBrowserFlow,
  redirectToKratosBrowserFlow,
  type KratosBrowserFlow,
  type KratosFlowType,
  type KratosUiMessage,
  type KratosUiNode,
} from "@/modules/auth/lib/kratos"
import { describeKratosFlowLoadError, localizeKratosMessage } from "@/modules/auth/lib/kratos-messages"
import { resolveKratosInputLabelKeys, resolveKratosSubmitLabelKey } from "@/modules/auth/lib/kratos-labels"
import {
  resolveFieldsToValidate,
  resolveValidationSubmitter,
  type KratosSubmitterInfo,
} from "@/modules/auth/lib/kratos-validation"
import { translateIfExists } from "@/shared/i18n"

const logger = createLogger("kratos-flow")

interface UseKratosBrowserFlowOptions {
  getReturnTo?: () => string
  /**
   * Replaces the default hard navigation to Kratos when no flow id is in the
   * URL (e.g. to show an interstitial or probe reachability first). Receives
   * the resolved return_to, "" when none.
   */
  startFlow?: (returnTo: string) => void
}

export type KratosFlowMessageTone = "info" | "success" | "error" | "warning"

export interface KratosFlowMessage {
  key: string
  text: string
  tone: KratosFlowMessageTone
}

interface HiddenField {
  key: string
  group: string
  name: string
  value: string
  onLoadTrigger: string
}

interface VisibleField {
  key: string
  group: string
  name: string
  value: string
  type: string
  autocomplete: string
  label: string
  placeholder: string
  required: boolean
  disabled: boolean
  onClickTrigger: string
  messages: KratosFlowMessage[]
}

interface ActionButtonField {
  key: string
  group: string
  name: string
  value: string
  label: string
  disabled: boolean
  onClickTrigger: string
  messages: KratosFlowMessage[]
}

interface SubmitField {
  key: string
  group: string
  name: string
  value: string
  label: string
  /** Kratos text id of the label, e.g. 1070008 for "Resend code". */
  labelId: number | null
  disabled: boolean
  messages: KratosFlowMessage[]
}

/** Marks a rendered submit button so a submit event can be traced back to its Kratos node. */
export const KRATOS_SUBMIT_KEY_ATTRIBUTE = "data-kratos-submit"

interface ScriptField {
  key: string
  src: string
  type: string
  id: string
  nonce: string
  integrity: string
  crossOrigin: string
  referrerPolicy: string
  async: boolean
  defer: boolean
}

interface AnchorField {
  key: string
  id: string
  href: string
}

type DisplayFieldKind = "text" | "image"

interface DisplayField {
  key: string
  group: string
  kind: DisplayFieldKind
  label: string
  text: string
  src: string
  width: number
  height: number
  messages: KratosFlowMessage[]
}

function resolveEffectiveInputType(node: KratosUiNode): string {
  const normalized = normalizeInputType(node.attributes?.type)
  if (normalized !== "text") {
    return normalized
  }

  const trigger = resolveWindowTrigger(
    node.attributes?.onclickTrigger,
    node.attributes?.onclick
  )

  if (trigger) {
    return "button"
  }

  return normalized
}

const WINDOW_TRIGGER_PATTERN = /^window\.([A-Za-z_$][\w$]*)\(\)\s*;?$/

function normalizeInputType(value: unknown): string {
  if (typeof value !== "string") {
    return "text"
  }

  const normalized = value.toLowerCase()
  if (
    normalized === "button"
    || normalized === "email"
    || normalized === "text"
    || normalized === "password"
    || normalized === "number"
    || normalized === "hidden"
    || normalized === "submit"
  ) {
    return normalized
  }

  return "text"
}

function normalizeMessageTone(value: unknown): KratosFlowMessageTone {
  if (typeof value !== "string") {
    return "info"
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === "error") {
    return "error"
  }

  if (normalized === "success") {
    return "success"
  }

  if (normalized === "warning" || normalized === "warn") {
    return "warning"
  }

  return "info"
}

function readTypedMessages(messages: KratosUiMessage[] | undefined, prefix: string): KratosFlowMessage[] {
  return (messages ?? [])
    .map((message, index) => {
      const text = localizeKratosMessage(message)
      if (!text) {
        return null
      }

      const idValue = typeof message.id === "number" ? String(message.id) : String(index)
      return {
        key: `${prefix}-${idValue}-${index}`,
        text,
        tone: normalizeMessageTone(message.type),
      }
    })
    .filter((message): message is KratosFlowMessage => message !== null)
}

function prettifyFieldName(name: string): string {
  return name
    .split(".")
    .map((part) => part.replace(/[_-]+/g, " "))
    .join(" ")
}

function resolveFieldLabel(flowType: KratosFlowType, node: KratosUiNode, name: string): string {
  const mapped = resolveKratosInputLabelKeys(flowType, name)
  const localized = mapped ? translateIfExists(mapped.labelKey) : null
  return localized || node.meta?.label?.text?.trim() || prettifyFieldName(name)
}

function resolveFieldPlaceholder(flowType: KratosFlowType, name: string): string {
  const mapped = resolveKratosInputLabelKeys(flowType, name)
  if (!mapped?.placeholderKey) {
    return ""
  }
  return translateIfExists(mapped.placeholderKey) ?? ""
}

function resolveSubmitLabel(flowType: KratosFlowType, node: KratosUiNode, name: string, value: string, state: string): string {
  const key = resolveKratosSubmitLabelKey(flowType, name, value, { state, labelId: node.meta?.label?.id })
  const localized = key ? translateIfExists(key) : null
  return localized || node.meta?.label?.text?.trim() || value || translateIfExists("auth.kratos.labels.submit") || "Submit"
}

function normalizeGroup(value: unknown): string {
  if (typeof value !== "string") {
    return "default"
  }

  const trimmed = value.trim()
  return trimmed || "default"
}

function readOptionalString(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1"
  }

  if (typeof value === "number") {
    return value !== 0
  }

  return false
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function resolveWindowTrigger(
  explicitTrigger: unknown,
  expression: unknown
): string {
  const direct = readOptionalString(explicitTrigger)
  if (direct) {
    return direct
  }

  const script = readOptionalString(expression)
  if (!script) {
    return ""
  }

  const matched = script.match(WINDOW_TRIGGER_PATTERN)
  return matched?.[1] ?? ""
}

function readTextAttribute(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  const textValue = record.text
  if (typeof textValue === "string" && textValue.trim() !== "") {
    return textValue.trim()
  }

  const context = record.context
  if (!context || typeof context !== "object") {
    return ""
  }

  const contextRecord = context as Record<string, unknown>
  const secret = contextRecord.secret
  if (typeof secret === "string" && secret.trim() !== "") {
    return secret.trim()
  }

  const secrets = contextRecord.secrets
  if (!Array.isArray(secrets)) {
    return ""
  }

  const codes = secrets
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return ""
      }

      const text = (entry as Record<string, unknown>).text
      return typeof text === "string" ? text.trim() : ""
    })
    .filter((item) => item !== "")

  return codes.join("\n")
}

export function useKratosBrowserFlow(
  flowType: KratosFlowType,
  options: UseKratosBrowserFlowOptions = {}
) {
  const route = useRoute()
  const loading = ref(true)
  const loadError = ref("")
  const flow = ref<KratosBrowserFlow | null>(null)
  const fieldValues = reactive<Record<string, string>>({})
  // Client-side "required" errors keyed by node name; Kratos still validates
  // server-side, this only saves the round-trip for an obviously empty form.
  const fieldErrors = reactive<Record<string, string>>({})
  const injectedScripts = ref<HTMLScriptElement[]>([])

  const flowId = computed(() => {
    const rawFlow = route.query.flow
    return typeof rawFlow === "string" ? rawFlow.trim() : ""
  })

  function resetFieldErrors() {
    Object.keys(fieldErrors).forEach((key) => {
      delete fieldErrors[key]
    })
  }

  function resetFieldValues() {
    Object.keys(fieldValues).forEach((key) => {
      delete fieldValues[key]
    })
    resetFieldErrors()
  }

  /**
   * The Kratos submit node behind the button that fired a submit event. The
   * button carries its node key as `data-kratos-submit`; a button without it
   * is matched by name/value, or described from its own attributes.
   */
  function resolveEventSubmitter(event: Event | undefined): KratosSubmitterInfo | null {
    const submitter = (event as SubmitEvent | undefined)?.submitter
    if (!submitter) {
      return null
    }

    const key = submitter.getAttribute(KRATOS_SUBMIT_KEY_ATTRIBUTE) ?? ""
    const byKey = key ? submitFields.value.find((submit) => submit.key === key) : undefined
    if (byKey) {
      return byKey
    }

    const name = submitter.getAttribute("name") ?? ""
    const value = submitter.getAttribute("value") ?? ""
    const byName = submitFields.value.find((submit) => submit.name === name && submit.value === value)
    return byName ?? { name, value, group: "default", labelId: null }
  }

  /**
   * Marks empty required inputs and reports whether the form may be posted.
   * The check covers only the fields of the method the clicked button names
   * (see resolveFieldsToValidate); OIDC, passkey and "Resend code" buttons
   * always pass. Kratos still validates server-side.
   */
  function validateVisibleFields(event?: Event): boolean {
    resetFieldErrors()
    const submitter = resolveValidationSubmitter(resolveEventSubmitter(event), submitFields.value)
    const names = new Set(resolveFieldsToValidate(submitter, visibleFields.value))
    for (const field of visibleFields.value) {
      if (!names.has(field.name)) continue
      if ((fieldValues[field.name] ?? "").trim() === "") {
        fieldErrors[field.name] = translateIfExists("auth.validation.required") ?? "Required"
      }
    }
    return Object.keys(fieldErrors).length === 0
  }

  // Typing into a flagged field clears its error.
  watch(
    () => ({ ...fieldValues }),
    (next, prev) => {
      for (const key of Object.keys(fieldErrors)) {
        if (next[key] !== prev?.[key]) {
          delete fieldErrors[key]
        }
      }
    },
  )

  function seedFieldValues(nextFlow: KratosBrowserFlow) {
    resetFieldValues()
    nextFlow.ui.nodes.forEach((node) => {
      const name = node.attributes?.name
      const type = resolveEffectiveInputType(node)
      if (!name || type === "hidden") {
        return
      }

      const rawValue = node.attributes?.value
      fieldValues[name] = typeof rawValue === "string" ? rawValue : ""
    })
  }

  function resolveReturnTo(): string {
    const value = options.getReturnTo?.()
    return typeof value === "string" ? value.trim() : ""
  }

  function startFlow() {
    const returnTo = resolveReturnTo()
    if (options.startFlow) {
      options.startFlow(returnTo)
      return
    }
    redirectToKratosBrowserFlow(
      flowType,
      returnTo ? { returnTo } : {}
    )
  }

  async function loadFlow() {
    if (!flowId.value) {
      startFlow()
      return
    }

    loading.value = true
    loadError.value = ""
    try {
      const nextFlow = await fetchKratosBrowserFlow(flowType, flowId.value)
      flow.value = nextFlow
      seedFieldValues(nextFlow)
    } catch (error: unknown) {
      flow.value = null
      resetFieldValues()
      loadError.value = describeKratosFlowLoadError(flowType)
      logger.warn(`Failed to load ${flowType} flow`, error)
    } finally {
      loading.value = false
    }
  }

  watch(
    flowId,
    () => {
      void loadFlow()
    },
    { immediate: true }
  )

  const generalMessages = computed(() => readTypedMessages(flow.value?.ui.messages, "general"))

  const hiddenFields = computed<HiddenField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        const name = node.attributes?.name
        if (!name || resolveEffectiveInputType(node) !== "hidden") {
          return null
        }

        return {
          key: `${name}-${index}`,
          group: normalizeGroup(node.group),
          name,
          value: typeof node.attributes?.value === "string" ? node.attributes.value : "",
          onLoadTrigger: resolveWindowTrigger(
            node.attributes?.onloadTrigger,
            node.attributes?.onload
          ),
        }
      })
      .filter((field): field is HiddenField => field !== null)
  )

  const visibleFields = computed<VisibleField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        const name = node.attributes?.name
        const type = resolveEffectiveInputType(node)
        if (!name || type === "hidden" || type === "submit" || type === "button") {
          return null
        }

        return {
          key: `${name}-${index}`,
          group: normalizeGroup(node.group),
          name,
          value: typeof node.attributes?.value === "string" ? node.attributes.value : "",
          type,
          autocomplete: readOptionalString(node.attributes?.autocomplete),
          label: resolveFieldLabel(flowType, node, name),
          placeholder: resolveFieldPlaceholder(flowType, name),
          required: node.attributes?.required === true,
          disabled: node.attributes?.disabled === true,
          onClickTrigger: resolveWindowTrigger(
            node.attributes?.onclickTrigger,
            node.attributes?.onclick
          ),
          messages: readTypedMessages(node.messages, `${name}-${index}`),
        }
      })
      .filter((field): field is VisibleField => field !== null)
  )

  const buttonFields = computed<ActionButtonField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        const name = node.attributes?.name
        const type = resolveEffectiveInputType(node)
        if (!name || type !== "button") {
          return null
        }

        return {
          key: `${name}-${index}`,
          group: normalizeGroup(node.group),
          name,
          value: typeof node.attributes?.value === "string" ? node.attributes.value : "",
          label: resolveFieldLabel(flowType, node, name),
          disabled: node.attributes?.disabled === true,
          onClickTrigger: resolveWindowTrigger(
            node.attributes?.onclickTrigger,
            node.attributes?.onclick
          ),
          messages: readTypedMessages(node.messages, `${name}-${index}`),
        }
      })
      .filter((field): field is ActionButtonField => field !== null)
  )

  const submitFields = computed<SubmitField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        if (resolveEffectiveInputType(node) !== "submit") {
          return null
        }

        const name = typeof node.attributes?.name === "string" ? node.attributes.name : ""
        const value = typeof node.attributes?.value === "string" ? node.attributes.value : ""
        const label = resolveSubmitLabel(flowType, node, name, value, typeof flow.value?.state === "string" ? flow.value.state : "")

        return {
          key: `${name || "submit"}-${index}`,
          group: normalizeGroup(node.group),
          name,
          value,
          label,
          labelId: typeof node.meta?.label?.id === "number" ? node.meta.label.id : null,
          disabled: node.attributes?.disabled === true,
          messages: readTypedMessages(node.messages, `${name || "submit"}-${index}`),
        }
      })
      .filter((field): field is SubmitField => field !== null)
  )

  const scriptFields = computed<ScriptField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        if (node.type !== "script") {
          return null
        }

        const src = readOptionalString(node.attributes?.src)
        if (!src) {
          return null
        }

        return {
          key: `${src}-${index}`,
          src,
          type: readOptionalString(node.attributes?.type) || "text/javascript",
          id: readOptionalString(node.attributes?.id),
          nonce: readOptionalString(node.attributes?.nonce),
          integrity: readOptionalString(node.attributes?.integrity),
          crossOrigin: readOptionalString(node.attributes?.crossorigin),
          referrerPolicy: readOptionalString(node.attributes?.referrerpolicy),
          async: readBoolean(node.attributes?.async),
          defer: readBoolean(node.attributes?.defer),
        }
      })
      .filter((field): field is ScriptField => field !== null)
  )

  const displayFields = computed<DisplayField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        if (node.type === "text") {
          const text = readTextAttribute(node.attributes?.text)
          if (!text) {
            return null
          }

          return {
            key: `text-${index}`,
            group: normalizeGroup(node.group),
            kind: "text",
            label: readOptionalString(node.meta?.label?.text),
            text,
            src: "",
            width: 0,
            height: 0,
            messages: readTypedMessages(node.messages, `text-${index}`),
          }
        }

        if (node.type === "img") {
          const src = readOptionalString(node.attributes?.src)
          if (!src) {
            return null
          }

          return {
            key: `img-${index}`,
            group: normalizeGroup(node.group),
            kind: "image",
            label: readOptionalString(node.meta?.label?.text),
            text: "",
            src,
            width: readNumber(node.attributes?.width),
            height: readNumber(node.attributes?.height),
            messages: readTypedMessages(node.messages, `img-${index}`),
          }
        }

        return null
      })
      .filter((field): field is DisplayField => field !== null)
  )

  // Link nodes, such as the "continue" link Kratos adds to a passed
  // verification flow. Their href is untrusted: callers must validate it.
  const anchorFields = computed<AnchorField[]>(() =>
    (flow.value?.ui.nodes ?? [])
      .map((node, index) => {
        if (node.type !== "a") {
          return null
        }

        const href = readOptionalString(node.attributes?.href)
        if (!href) {
          return null
        }

        const id = readOptionalString(node.attributes?.id)
        return {
          key: `${id || "a"}-${index}`,
          id,
          href,
        }
      })
      .filter((field): field is AnchorField => field !== null)
  )

  function clearInjectedScripts() {
    injectedScripts.value.forEach((script) => {
      script.remove()
    })
    injectedScripts.value = []
  }

  function applyScriptFields(fields: ScriptField[]) {
    if (typeof document === "undefined") {
      return
    }

    clearInjectedScripts()
    fields.forEach((field) => {
      const script = document.createElement("script")
      script.src = field.src
      script.type = field.type
      script.async = field.async
      script.defer = field.defer

      if (field.id) {
        script.id = field.id
      }
      if (field.nonce) {
        script.nonce = field.nonce
      }
      if (field.integrity) {
        script.integrity = field.integrity
      }
      if (field.crossOrigin) {
        script.crossOrigin = field.crossOrigin
      }
      if (field.referrerPolicy) {
        script.referrerPolicy = field.referrerPolicy
      }

      script.dataset.kratosFlow = flowType
      document.body.appendChild(script)
      injectedScripts.value.push(script)
    })
  }

  function invokeWindowTrigger(triggerName: string): boolean {
    if (typeof window === "undefined" || !triggerName) {
      return false
    }

    const candidate = (window as unknown as Record<string, unknown>)[triggerName]
    if (typeof candidate !== "function") {
      return false
    }

    try {
      ;(candidate as () => void)()
      return true
    } catch (error: unknown) {
      logger.warn(`Kratos trigger ${triggerName} failed`, error)
      return false
    }
  }

  function invokeVisibleFieldAction(field: { onClickTrigger: string }) {
    if (!field.onClickTrigger) {
      return
    }

    const invoked = invokeWindowTrigger(field.onClickTrigger)
    if (!invoked) {
      logger.warn(`Kratos trigger ${field.onClickTrigger} is not ready`)
    }
  }

  async function runHiddenFieldOnLoadTriggers() {
    if (typeof window === "undefined") {
      return
    }

    const triggers = hiddenFields.value
      .map((field) => field.onLoadTrigger)
      .filter((trigger) => trigger !== "")

    if (triggers.length === 0) {
      return
    }

    await nextTick()
    for (const trigger of triggers) {
      let invoked = invokeWindowTrigger(trigger)
      if (invoked) {
        continue
      }

      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        invoked = invokeWindowTrigger(trigger)
        if (invoked) {
          break
        }
      }
    }
  }

  watch(
    scriptFields,
    (fields) => {
      applyScriptFields(fields)
    },
    { immediate: true }
  )

  watch(
    [scriptFields, hiddenFields],
    () => {
      void runHiddenFieldOnLoadTriggers()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    clearInjectedScripts()
  })

  const submitLabel = computed(() => submitFields.value[0]?.label ?? "Submit")
  const submitName = computed(() => submitFields.value[0]?.name ?? "")
  const submitValue = computed(() => submitFields.value[0]?.value ?? "")

  const action = computed(() => flow.value?.ui.action ?? "")
  const flowReturnTo = computed(() =>
    typeof flow.value?.return_to === "string" ? flow.value.return_to : ""
  )
  const flowState = computed(() =>
    typeof flow.value?.state === "string" ? flow.value.state : ""
  )
  const method = computed(() => {
    const rawMethod = flow.value?.ui.method?.toLowerCase()
    return rawMethod === "get" ? "get" : "post"
  })

  function restartFlow() {
    startFlow()
  }

  return {
    loading,
    loadError,
    fieldValues,
    fieldErrors,
    validateVisibleFields,
    generalMessages,
    hiddenFields,
    visibleFields,
    buttonFields,
    submitFields,
    displayFields,
    anchorFields,
    submitLabel,
    submitName,
    submitValue,
    action,
    flowReturnTo,
    flowState,
    method,
    invokeVisibleFieldAction,
    restartFlow,
  }
}
