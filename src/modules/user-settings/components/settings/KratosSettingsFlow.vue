<script setup lang="ts">
import { computed, ref, useTemplateRef, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { Button } from "@/components/ui/button"
import { KeyRound, LifeBuoy, Link2, Loader2, PowerOff, Smartphone, Trash2, Unlink, Usb } from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow, { type SettingsRowTone } from "@/shared/components/settings/SettingsRow.vue"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import KratosFieldInput from "@/modules/auth/components/KratosFieldInput.vue"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import KratosSettingsActions from "@/modules/user-settings/components/settings/KratosSettingsActions.vue"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"
import { formatKratosProviderName } from "@/modules/auth/lib/kratos-messages"
import { createAllowedReturnToOrigins } from "@/modules/auth/lib/return-to"
import { useKratosSettingsRedirect } from "@/modules/user-settings/composables/useKratosSettingsRedirect"
import {
  classifySettingsAction,
  isKratosSettingsMethodGroup,
  pickSettingsEnterTarget,
  resolveSettingsDangerKind,
  resolveSettingsDangerVerb,
  resolveSettingsMethodStatus,
  splitSettingsCodeList,
  type KratosSettingsMethodGroup,
  type KratosSettingsMethodStatus,
} from "@/modules/user-settings/lib/kratos-settings-groups"
import {
  normalizeKratosSettingsSection as normalizeSection,
  resolveKnownKratosSettingsSection,
  type KratosSettingsSection,
} from "@/modules/user-settings/lib/kratos-settings-section"

const props = defineProps<{
  section?: string
}>()

const route = useRoute()
const initialSection = computed(() => normalizeSection(props.section))

function resolveSectionPath(): string {
  return "/user/settings"
}

function resolveKratosOrigin(): string {
  if (typeof window === "undefined") {
    return ""
  }

  try {
    return new URL(getKratosPublicUrl(), window.location.origin).origin
  } catch {
    return ""
  }
}

function parseAbsoluteUrl(value: string): URL | null {
  if (typeof window === "undefined") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    return new URL(trimmed, window.location.origin)
  } catch {
    return null
  }
}

function isKratosCandidate(url: URL, kratosOrigin: string): boolean {
  if (url.pathname.startsWith("/self-service/")) {
    return true
  }

  return kratosOrigin !== "" && url.origin === kratosOrigin
}

function resolveFrontendOrigin(): string {
  if (typeof window === "undefined") {
    return ""
  }

  const kratosOrigin = resolveKratosOrigin()
  const allowedOrigins = createAllowedReturnToOrigins(window.location.origin)
  const envFrontend = parseAbsoluteUrl(import.meta.env.VITE_HARUKI_TOOLBOX_WEB_URL ?? "")
  if (envFrontend && !isKratosCandidate(envFrontend, kratosOrigin)) {
    allowedOrigins.add(envFrontend.origin)
  }

  const queryReturnTo = typeof route.query.return_to === "string" ? route.query.return_to : ""
  const searchReturnTo = new URLSearchParams(window.location.search).get("return_to") ?? ""
  const candidates = [
    queryReturnTo,
    searchReturnTo,
  ]

  for (const candidate of candidates) {
    const parsed = parseAbsoluteUrl(candidate)
    if (!parsed) {
      continue
    }

    if (isKratosCandidate(parsed, kratosOrigin)) {
      continue
    }

    if (!allowedOrigins.has(parsed.origin)) {
      continue
    }

    return parsed.origin
  }

  if (envFrontend && allowedOrigins.has(envFrontend.origin)) {
    return envFrontend.origin
  }

  // Fallback to current frontend origin.
  return window.location.origin
}

const settingsReturnTo = computed(() => {
  if (typeof window === "undefined") {
    return ""
  }

  const section = normalizeSection(route.query.section) || initialSection.value
  const safePath = resolveSectionPath()
  const baseOrigin = resolveFrontendOrigin()
  const url = new URL(safePath, baseOrigin)
  if (section) {
    url.searchParams.set("section", section)
  }
  url.searchParams.set("_identity_saved", "1")
  return url.toString()
})

// Leaving for the identity service goes through a visible step: the page
// says where it is going, probes the host, and reports an unreachable host
// inline instead of landing on the browser's error page.
const redirect = useKratosSettingsRedirect()

const {
  loading,
  loadError,
  fieldValues,
  generalMessages,
  hiddenFields,
  visibleFields,
  buttonFields,
  submitFields,
  displayFields,
  submitLabel,
  action,
  flowReturnTo,
  method,
  invokeVisibleFieldAction,
  restartFlow,
} = useKratosBrowserFlow("settings", {
  getReturnTo: () => settingsReturnTo.value,
  startFlow: (returnTo) => {
    void redirect.start(returnTo)
  },
})

const { t } = useI18n()

// The page is titled after the section it edits (email and nickname,
// password, two-step verification, linked accounts); unknown sections read as
// the profile.
const knownSection = computed<KratosSettingsSection>(() => resolveKnownKratosSettingsSection(requestedSection.value))
const pageTitle = computed(() => t(`userSettings.kratosFlow.titles.${knownSection.value}`))

function resolveSectionGroups(section: string): string[] {
  if (section === "profile") {
    return ["profile"]
  }

  if (section === "password") {
    return ["password"]
  }

  if (section === "mfa") {
    return ["totp", "webauthn", "passkey", "lookup_secret"]
  }

  if (section === "oidc") {
    return ["oidc"]
  }

  return section ? [section] : []
}

function readSectionFromReturnTo(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  try {
    const parsed = typeof window === "undefined"
      ? new URL(trimmed, "https://haruki.local")
      : new URL(trimmed, window.location.origin)
    return normalizeSection(parsed.searchParams.get("section"))
  } catch {
    const queryStart = trimmed.indexOf("?")
    if (queryStart < 0) {
      return ""
    }

    const query = trimmed.slice(queryStart + 1)
    const params = new URLSearchParams(query)
    return normalizeSection(params.get("section"))
  }
}

const requestedSection = computed(() => {
  const direct = normalizeSection(route.query.section)
  if (direct) {
    return direct
  }

  const fromReturnTo = readSectionFromReturnTo(flowReturnTo.value)
  if (fromReturnTo) {
    return fromReturnTo
  }

  return initialSection.value
})

const activeGroup = computed(() => {
  const submits = submitFields.value
  if (submits.length === 0) {
    return ""
  }

  const requested = requestedSection.value
  if (requested) {
    const requestedGroups = resolveSectionGroups(requested)
    const exactGroup = submits.find((submit) => requestedGroups.includes(submit.group))
    if (exactGroup) {
      return exactGroup.group
    }

    const byMethod = submits.find((submit) => requestedGroups.includes(submit.value.trim().toLowerCase()))
    if (byMethod) {
      return byMethod.group
    }
  }

  const preferredGroups = ["profile", "password", "oidc", "totp", "webauthn", "passkey", "lookup_secret"]
  for (const group of preferredGroups) {
    const match = submits.find((submit) => {
      const method = submit.value.trim().toLowerCase()
      return submit.group === group || method === group
    })
    if (match) {
      return match.group
    }
  }

  return submits[0]?.group ?? ""
})

const availableGroups = computed(() => {
  const groups = new Set<string>()

  visibleFields.value.forEach((field) => groups.add(field.group))
  buttonFields.value.forEach((field) => groups.add(field.group))
  submitFields.value.forEach((field) => groups.add(field.group))
  displayFields.value.forEach((field) => groups.add(field.group))

  return groups
})

const allowedGroups = computed(() => {
  const requestedGroups = resolveSectionGroups(requestedSection.value)
  if (requestedGroups.length > 0) {
    const methodGroups = new Set(submitFields.value.map((submit) => submit.value.trim().toLowerCase()))
    const matched = requestedGroups.filter((group) => {
      return availableGroups.value.has(group) || methodGroups.has(group)
    })
    if (matched.length > 0) {
      return matched
    }
  }

  return activeGroup.value ? [activeGroup.value] : []
})

const displayedVisibleFields = computed(() => {
  const groups = allowedGroups.value
  if (groups.length === 0) {
    return visibleFields.value
  }

  return visibleFields.value.filter((field) => groups.includes(field.group))
})

const displayedButtonFields = computed(() => {
  const groups = allowedGroups.value
  if (groups.length === 0) {
    return buttonFields.value
  }

  return buttonFields.value.filter((field) => groups.includes(field.group))
})

const displayedHiddenFields = computed(() => {
  const groups = allowedGroups.value
  if (groups.length === 0) {
    return hiddenFields.value
  }

  const filtered = hiddenFields.value.filter((field) => field.group === "default" || groups.includes(field.group))
  return filtered.length > 0 ? filtered : hiddenFields.value
})

const displayedDisplayFields = computed(() => {
  const groups = allowedGroups.value
  if (groups.length === 0) {
    return displayFields.value
  }

  return displayFields.value.filter((field) => groups.includes(field.group))
})

const displayedSubmitFields = computed(() => {
  const groups = allowedGroups.value
  if (groups.length === 0) {
    return submitFields.value
  }

  return submitFields.value.filter((submit) => groups.includes(submit.group))
})

function groupTitle(group: string): string {
  if (group === "passkey") {
    return t("userSettings.kratosFlow.groups.passkey")
  }

  if (group === "webauthn") {
    return t("userSettings.kratosFlow.groups.webauthn")
  }

  if (group === "totp") {
    return t("userSettings.kratosFlow.groups.totp")
  }

  if (group === "lookup_secret") {
    return t("userSettings.kratosFlow.groups.lookupSecret")
  }

  if (group === "oidc") {
    return t("userSettings.kratosFlow.groups.oidc")
  }

  if (group === "profile") {
    return t("userSettings.kratosFlow.groups.profile")
  }

  if (group === "password") {
    return t("userSettings.kratosFlow.groups.password")
  }

  return group
}

const isMfaSection = computed(() => requestedSection.value === "mfa")

const groupedSections = computed(() => {
  const ordered: string[] = []
  const seen = new Set<string>()
  const preferred = isMfaSection.value
    ? ["passkey", "webauthn", "totp", "lookup_secret"]
    : allowedGroups.value

  const addGroup = (group: string) => {
    if (!group || seen.has(group)) {
      return
    }
    seen.add(group)
    ordered.push(group)
  }

  preferred.forEach(addGroup)
  displayedDisplayFields.value.forEach((field) => addGroup(field.group))
  displayedVisibleFields.value.forEach((field) => addGroup(field.group))
  displayedButtonFields.value.forEach((field) => addGroup(field.group))
  displayedSubmitFields.value.forEach((field) => addGroup(field.group))

  const sections = ordered
    .map((group) => {
      const sectionDisplayFields = displayedDisplayFields.value.filter((field) => field.group === group)
      const sectionVisibleFields = displayedVisibleFields.value.filter((field) => field.group === group)
      const sectionButtonFields = displayedButtonFields.value.filter((field) => field.group === group)
      const sectionSubmitFields = displayedSubmitFields.value.filter((field) => field.group === group)

      if (
        sectionDisplayFields.length === 0
        && sectionVisibleFields.length === 0
        && sectionButtonFields.length === 0
        && sectionSubmitFields.length === 0
      ) {
        return null
      }

      return {
        group,
        title: groupTitle(group),
        displayFields: sectionDisplayFields,
        visibleFields: sectionVisibleFields,
        buttonFields: sectionButtonFields,
        submitFields: sectionSubmitFields,
      }
    })
    .filter((section): section is NonNullable<typeof section> => section !== null)

  if (sections.length > 0) {
    return sections
  }

  return [{
    group: "default",
    title: "",
    displayFields: displayedDisplayFields.value,
    visibleFields: displayedVisibleFields.value,
    buttonFields: displayedButtonFields.value,
    submitFields: displayedSubmitFields.value,
  }]
})

const showGroupTitle = computed(() => isMfaSection.value || groupedSections.value.length > 1)

// Kratos labels are translated, so actions are told apart by their Kratos
// text id or node name, never by label wording (see kratos-settings-groups.ts).
type SettingsSection = (typeof groupedSections.value)[number]
type SettingsSubmit = SettingsSection["submitFields"][number]
type SettingsButton = SettingsSection["buttonFields"][number]

const LAST_METHOD_REMOVAL_NAMES = new Set(["passkey_remove", "webauthn_remove"])

/** A disabled passkey / security key removal: Kratos greys it out while it is the account's only way to sign in. */
function isLastSignInMethodRemoval(action: { name: string; disabled?: boolean }): boolean {
  return action.disabled === true && LAST_METHOD_REMOVAL_NAMES.has(action.name)
}

const DANGER_ICONS = { remove: Trash2, disable: PowerOff, unlink: Unlink } as const

function dangerIcon(submit: SettingsSubmit): Component {
  return DANGER_ICONS[resolveSettingsDangerVerb(resolveSettingsDangerKind(submit))]
}

// One status line per second-step method: whether it is set up. The group's
// heading already names the method.
interface MethodIntro {
  icon: Component
  tone: SettingsRowTone
  label: string
}

const METHOD_ICONS: Record<KratosSettingsMethodGroup, Component> = {
  passkey: KeyRound,
  webauthn: Usb,
  totp: Smartphone,
  lookup_secret: LifeBuoy,
}

// Passkeys and security keys are things you add; the authenticator app and
// the backup codes are switched on.
const STATUS_KEYS: Record<KratosSettingsMethodGroup, Record<KratosSettingsMethodStatus, string>> = {
  passkey: { on: "added", pending: "added", off: "notAdded" },
  webauthn: { on: "added", pending: "added", off: "notAdded" },
  totp: { on: "on", pending: "pending", off: "off" },
  lookup_secret: { on: "on", pending: "pending", off: "off" },
}

const STATUS_TONES: Record<KratosSettingsMethodStatus, SettingsRowTone> = {
  on: "success",
  pending: "warning",
  off: "default",
}

function methodIntro(section: SettingsSection): MethodIntro | null {
  if (!isKratosSettingsMethodGroup(section.group)) {
    return null
  }

  const status = resolveSettingsMethodStatus(section.group, section.submitFields)
  return {
    icon: METHOD_ICONS[section.group],
    tone: STATUS_TONES[status],
    label: t(`userSettings.kratosFlow.status.${STATUS_KEYS[section.group][status]}`),
  }
}

/** A linked-account group is a list of providers, each with its one link or unlink button. */
function isProviderGroup(section: SettingsSection): boolean {
  return section.group === "oidc"
    && section.submitFields.length > 0
    && section.buttonFields.length === 0
    && section.visibleFields.length === 0
    && section.displayFields.length === 0
    && section.submitFields.every((submit) => submit.name === "link" || submit.name === "unlink")
}

function providerName(submit: SettingsSubmit): string {
  return formatKratosProviderName(submit.value) || submit.label
}

function isLinkedProvider(submit: SettingsSubmit): boolean {
  return submit.name === "unlink"
}

/** Backup codes are a list; every other text node (the TOTP secret) is one value. */
function displayLines(field: SettingsSection["displayFields"][number]): string[] {
  return field.group === "lookup_secret" ? splitSettingsCodeList(field.text) : []
}

// What the template draws for each group: the status line, what is already
// there (each with its removal), the inputs, and the group's other buttons
// (triggers and non-destructive submits, in Kratos order). Those buttons sit
// in a footer under the inputs they post; a method that asks for nothing
// (add a passkey, generate codes) keeps them on its status line instead.
const sectionViews = computed(() =>
  groupedSections.value.map((section) => {
    const intro = methodIntro(section)
    const actionSubmits = section.submitFields.filter((submit) => classifySettingsAction(submit) !== "danger")
    const hasActions = section.buttonFields.length > 0 || actionSubmits.length > 0
    const actionsOnIntro = intro !== null
      && section.visibleFields.length === 0
      && actionSubmits.every((submit) => classifySettingsAction(submit) !== "commit")
    return {
      ...section,
      intro,
      providers: isProviderGroup(section),
      dangerousSubmits: section.submitFields.filter((submit) => classifySettingsAction(submit) === "danger"),
      actionSubmits,
      actionMessages: [...section.buttonFields, ...actionSubmits].flatMap((item) => item.messages),
      introActions: hasActions && actionsOnIntro,
      footerActions: hasActions && !actionsOnIntro,
    }
  })
)

// --- dangerous actions ask first ------------------------------------------
// The removal buttons are ordinary submit buttons of the Kratos form. A click
// is held back, the confirmation opens, and confirming clicks the very same
// button again, this time let through: the form posts exactly what a direct
// click would have posted.
const formElement = useTemplateRef<HTMLFormElement>("settingsForm")
const confirmOpen = ref(false)
const pendingDanger = ref<{ submit: SettingsSubmit; button: HTMLButtonElement } | null>(null)
let confirmedSubmitKey = ""

function handleDangerousClick(event: MouseEvent, submit: SettingsSubmit) {
  if (confirmedSubmitKey === submit.key) {
    confirmedSubmitKey = ""
    return
  }

  event.preventDefault()
  const button = event.currentTarget
  if (!(button instanceof HTMLButtonElement)) {
    return
  }
  pendingDanger.value = { submit, button }
  confirmOpen.value = true
}

function confirmDangerousSubmit() {
  const pending = pendingDanger.value
  if (!pending) {
    return
  }
  confirmedSubmitKey = pending.submit.key
  pending.button.click()
}

const pendingDangerKind = computed(() =>
  pendingDanger.value ? resolveSettingsDangerKind(pendingDanger.value.submit) : "generic"
)
const confirmTitle = computed(() =>
  t("userSettings.kratosFlow.confirm.title", { action: pendingDanger.value?.submit.label ?? "" })
)
const confirmDescription = computed(() => t(`userSettings.kratosFlow.confirm.descriptions.${pendingDangerKind.value}`))
const confirmLabel = computed(() =>
  t(`userSettings.kratosFlow.confirm.actions.${resolveSettingsDangerVerb(pendingDangerKind.value)}`)
)

// --- Enter in a field presses its own group's button ----------------------
// Every group shares the one Kratos form, so the browser would press the
// first submit button on the page (another method's, or a removal).
function handleFieldEnter(event: KeyboardEvent, section: SettingsSection) {
  // Only from the input itself: Enter on the show-password button toggles it.
  if (event.isComposing || !(event.target instanceof HTMLInputElement)) {
    return
  }

  event.preventDefault()
  const target = pickSettingsEnterTarget<SettingsSubmit, SettingsButton>(section.submitFields, section.buttonFields)
  if (!target) {
    return
  }
  if (target.kind === "trigger") {
    invokeVisibleFieldAction(target.action)
    return
  }
  const buttons = formElement.value?.querySelectorAll<HTMLButtonElement>("button[data-settings-submit]") ?? []
  for (const button of buttons) {
    if (button.dataset.settingsSubmit === target.action.key) {
      button.click()
      return
    }
  }
}

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

/** Host shown on the interstitial so the person knows where they are being sent. */
const kratosHost = computed(() => {
  const origin = resolveKratosOrigin()
  try {
    return origin ? new URL(origin).host : ""
  } catch {
    return origin
  }
})

const isLeavingForKratos = computed(() => redirect.status.value === "probing" || redirect.status.value === "redirecting")
</script>

<template>
  <div class="@container mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-5" data-kratos-page>
    <!-- A way back in every state but the interstitial, which is about to leave the page. -->
    <PageHeader
      size="compact"
      :title="pageTitle"
      :back="isLeavingForKratos ? null : { name: 'user.settings' }"
      :back-label="t('userSettings.kratosFlow.redirect.backToSettings')"
    />

    <div
      v-if="redirect.status.value === 'unreachable'"
      class="rounded-xl border bg-card px-4"
      data-testid="kratos-redirect-unreachable"
    >
      <LoadErrorState
        :title="t('userSettings.kratosFlow.redirect.unreachable')"
        description=""
        :retrying="false"
        @retry="redirect.retry"
      />
    </div>
    <div
      v-else-if="isLeavingForKratos"
      class="flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-10 text-center"
      role="status"
      aria-live="polite"
      data-testid="kratos-redirect-interstitial"
    >
      <Loader2 class="mb-1 size-6 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden="true" />
      <p class="text-sm font-medium">{{ t("userSettings.kratosFlow.redirect.title") }}</p>
      <p v-if="kratosHost" class="min-w-0 text-xs text-muted-foreground [overflow-wrap:anywhere]">
        {{ t("userSettings.kratosFlow.redirect.destination", { host: kratosHost }) }}
      </p>
    </div>
    <p
      v-else-if="loading"
      class="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-12 text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {{ t("auth.common.loadingFlow") }}
    </p>
    <div v-else-if="loadError" class="rounded-xl border bg-card px-4">
      <LoadErrorState :title="loadError" description="" :retry-label="t('auth.common.restartFlow')" @retry="restartFlow" />
    </div>
    <form v-else ref="settingsForm" :action="action" :method="method" class="flex min-w-0 flex-col gap-5" novalidate>
      <input v-for="field in displayedHiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

      <div v-if="generalMessages.length > 0" class="min-w-0 rounded-xl border bg-card px-4 py-3" data-testid="kratos-settings-messages">
        <KratosFlowMessages :messages="generalMessages" />
      </div>

      <SettingsGroup
        v-for="section in sectionViews"
        :key="section.group"
        :title="showGroupTitle ? section.title : undefined"
        surface="card"
        :data-kratos-group="section.group"
      >
        <!-- Linked accounts: one line per provider with its link or unlink button. -->
        <template v-if="section.providers">
          <SettingsRow
            v-for="submit in section.submitFields"
            :key="submit.key"
            :icon="Link2"
            :tone="isLinkedProvider(submit) ? 'success' : 'default'"
            :label="providerName(submit)"
          >
            <template v-if="isLinkedProvider(submit)" #label>
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {{ t("userSettings.kratosFlow.providers.linked") }}
              </span>
            </template>
            <Button
              v-if="isLinkedProvider(submit)"
              type="submit"
              variant="outline"
              size="sm"
              class="h-auto min-h-8 max-w-full whitespace-normal py-1 text-destructive hover:text-destructive"
              :name="submit.name || undefined"
              :value="submit.value || undefined"
              :data-settings-submit="submit.key"
              :disabled="!isReady || submit.disabled"
              @click="handleDangerousClick($event, submit)"
            >
              {{ submit.label }}
            </Button>
            <Button
              v-else
              type="submit"
              variant="outline"
              size="sm"
              class="h-auto min-h-8 max-w-full whitespace-normal py-1"
              :name="submit.name || undefined"
              :value="submit.value || undefined"
              :data-settings-submit="submit.key"
              :disabled="!isReady || submit.disabled"
            >
              {{ submit.label }}
            </Button>
            <template v-if="submit.messages.length > 0" #below>
              <KratosFlowMessages :messages="submit.messages" variant="field" />
            </template>
          </SettingsRow>
        </template>

        <template v-else>
          <!-- Whether the method is set up. -->
          <SettingsRow
            v-if="section.intro"
            :icon="section.intro.icon"
            :tone="section.intro.tone"
            :label="section.intro.label"
          >
            <template v-if="section.introActions" #default>
              <KratosSettingsActions
                :buttons="section.buttonFields"
                :submits="section.actionSubmits"
                :ready="isReady"
                @trigger="invokeVisibleFieldAction"
              />
            </template>
          </SettingsRow>

          <!-- What Kratos shows rather than asks for: the QR code and its secret, the backup codes. -->
          <div
            v-if="section.displayFields.length > 0"
            class="flex min-w-0 flex-wrap items-start gap-x-5 gap-y-4 px-4 py-4"
            data-testid="kratos-settings-display"
          >
            <template v-for="field in section.displayFields" :key="field.key">
              <!-- A QR code needs a light ground to scan in the dark theme. -->
              <div v-if="field.kind === 'image'" class="shrink-0 rounded-lg dark:bg-white dark:p-2">
                <img
                  :src="field.src"
                  :alt="field.label || t('auth.kratos.labels.imageAlt')"
                  class="block size-40"
                  :width="field.width || undefined"
                  :height="field.height || undefined"
                  loading="lazy"
                />
              </div>
              <div v-else class="grid min-w-0 flex-1 basis-56 gap-2">
                <p v-if="field.label" class="text-sm text-muted-foreground">{{ field.label }}</p>
                <ul
                  v-if="displayLines(field).length > 0"
                  class="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm @min-[34rem]:grid-cols-3"
                >
                  <li v-for="(line, index) in displayLines(field)" :key="index" class="min-w-0 [overflow-wrap:anywhere]">{{ line }}</li>
                </ul>
                <p v-else class="min-w-0 font-mono text-sm whitespace-pre-line [overflow-wrap:anywhere]">{{ field.text }}</p>
                <KratosFlowMessages :messages="field.messages" variant="field" />
              </div>
            </template>
          </div>

          <!-- What is already there, each with the way to remove it. -->
          <div v-for="submit in section.dangerousSubmits" :key="submit.key" class="min-w-0">
            <button
              type="submit"
              class="group flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none"
              :name="submit.name || undefined"
              :value="submit.value || undefined"
              :data-settings-submit="submit.key"
              :disabled="!isReady || submit.disabled"
              @click="handleDangerousClick($event, submit)"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive-tint-foreground group-disabled:bg-muted group-disabled:text-muted-foreground"
                aria-hidden="true"
              >
                <component :is="dangerIcon(submit)" class="size-4" />
              </span>
              <span class="min-w-0 flex-1 text-sm font-medium text-destructive group-disabled:text-muted-foreground [overflow-wrap:anywhere]">
                {{ submit.label }}
              </span>
            </button>
            <!-- Kratos disables removing the last sign-in method; say why instead of leaving a dead button. -->
            <p
              v-if="isLastSignInMethodRemoval(submit)"
              class="-mt-1.5 px-4 pb-3 pl-15 text-xs text-muted-foreground"
              data-testid="kratos-last-method-hint"
            >
              {{ t("userSettings.kratosFlow.hints.lastSignInMethod") }}
            </p>
            <div v-if="submit.messages.length > 0" class="-mt-1.5 px-4 pb-3 pl-15">
              <KratosFlowMessages :messages="submit.messages" variant="field" />
            </div>
          </div>

          <div v-if="section.visibleFields.length > 0" class="grid min-w-0 gap-4 px-4 py-4">
            <KratosFieldInput
              v-for="field in section.visibleFields"
              :id="field.key"
              :key="field.key"
              v-model="fieldValues[field.name]"
              :name="field.name"
              :type="field.type"
              :label="field.label"
              :autocomplete="field.autocomplete"
              :required="field.required"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :messages="field.messages"
              @keydown.enter="handleFieldEnter($event, section)"
            />
          </div>

          <div v-if="section.actionMessages.length > 0" class="min-w-0 px-4 py-3">
            <KratosFlowMessages :messages="section.actionMessages" variant="field" />
          </div>
        </template>

        <template v-if="!section.providers && section.footerActions" #footer>
          <KratosSettingsActions
            :buttons="section.buttonFields"
            :submits="section.actionSubmits"
            :ready="isReady"
            @trigger="invokeVisibleFieldAction"
          />
        </template>
      </SettingsGroup>

      <div v-if="!isMfaSection && displayedSubmitFields.length === 0" class="flex justify-end">
        <Button type="submit" size="sm" :disabled="!isReady">{{ submitLabel || t("common.save") }}</Button>
      </div>
    </form>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmTitle"
      :description="confirmDescription"
      :confirm-label="confirmLabel"
      destructive
      :on-confirm="confirmDangerousSubmit"
    />
  </div>
</template>
