<script setup lang="ts">
import { computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, Mail, Save, UserRound, KeyRound, ShieldCheck } from "lucide-vue-next"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  useKratosBrowserFlow,
  type KratosFlowMessage,
} from "@/modules/auth/composables/useKratosBrowserFlow"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"

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
  const allowedOrigins = new Set<string>([window.location.origin])
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
})

const { t } = useI18n()

function normalizeSection(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  const section = value.trim().toLowerCase()
  if (section === "email" || section === "profile") {
    return "profile"
  }

  if (section === "password") {
    return "password"
  }

  if (section === "mfa" || section === "security") {
    return "mfa"
  }

  if (section === "oidc" || section === "social") {
    return "oidc"
  }

  return section
}

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

function isDangerousAction(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return (
    normalized.includes("disable")
    || normalized.includes("remove")
    || normalized.includes("unlink")
    || normalized.includes("删除")
    || normalized.includes("移除")
    || normalized.includes("禁用")
    || normalized.includes("解绑")
  )
}

function submitVariant(submit: { label: string; name: string; value: string }) {
  if (!isMfaSection.value) {
    return "default"
  }

  const signature = `${submit.label} ${submit.name} ${submit.value}`
  return isDangerousAction(signature) ? "destructive" : "outline"
}

function isPrimaryAction(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return (
    normalized.includes("add")
    || normalized.includes("register")
    || normalized.includes("enable")
    || normalized.includes("bind")
    || normalized.includes("link")
    || normalized.includes("添加")
    || normalized.includes("启用")
    || normalized.includes("绑定")
  )
}

function buttonFieldVariant(field: { label: string; name: string; value: string }) {
  if (!isMfaSection.value) {
    return "outline"
  }

  const signature = `${field.label} ${field.name} ${field.value}`
  if (isDangerousAction(signature)) {
    return "destructive"
  }

  return isPrimaryAction(signature) ? "default" : "outline"
}

function iconForField(name: string) {
  const normalized = name.toLowerCase()

  if (normalized.includes("passkey") || normalized.includes("webauthn")) {
    return KeyRound
  }

  if (normalized.includes("totp") || normalized.includes("lookup_secret")) {
    return ShieldCheck
  }

  if (name.endsWith("email")) {
    return Mail
  }

  if (name.toLowerCase().includes("password")) {
    return Lock
  }

  return UserRound
}

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

function isSuccessLikeMessage(message: KratosFlowMessage): boolean {
  if (message.tone === "success") {
    return true
  }

  if (message.tone !== "info") {
    return false
  }

  const normalized = message.text.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return (
    normalized.includes("success")
    || normalized.includes("saved")
    || normalized.includes("updated")
    || normalized.includes("changed")
    || normalized.includes("成功")
    || normalized.includes("已更新")
    || normalized.includes("已保存")
    || normalized.includes("已修改")
  )
}

const successToastMessages = computed(() => {
  const merged: KratosFlowMessage[] = []

  merged.push(...generalMessages.value)
  displayedVisibleFields.value.forEach((field) => merged.push(...field.messages))
  displayedButtonFields.value.forEach((field) => merged.push(...field.messages))
  displayedSubmitFields.value.forEach((field) => merged.push(...field.messages))
  displayedDisplayFields.value.forEach((field) => merged.push(...field.messages))

  return merged.filter((message) => isSuccessLikeMessage(message))
})

const shownSuccessMessageKeys = new Set<string>()

watch(
  successToastMessages,
  (messages) => {
    if (loading.value || loadError.value) {
      return
    }

    messages.forEach((message) => {
      const uniqueKey = `${message.key}:${message.text}`
      if (shownSuccessMessageKeys.has(uniqueKey)) {
        return
      }

      shownSuccessMessageKeys.add(uniqueKey)
      toast.success(message.text)
    })
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    shownSuccessMessageKeys.clear()
  }
)
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Save class="h-6 w-6" />
          {{ t("userSettings.kratosFlow.title") }}
        </CardTitle>
        <CardDescription>{{ t("userSettings.kratosFlow.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>
        <div v-else-if="loadError" class="space-y-4">
          <p class="text-sm text-destructive">{{ loadError }}</p>
          <Button class="w-full" @click="restartFlow">
            <Save class="mr-2 h-4 w-4" />
            {{ t("auth.common.restartFlow") }}
          </Button>
        </div>
        <form v-else :action="action" :method="method" class="space-y-4" novalidate>
          <input v-for="field in displayedHiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

          <KratosFlowMessages :messages="generalMessages" />

          <div class="space-y-4">
            <section
              v-for="section in groupedSections"
              :key="section.group"
              class="space-y-3 rounded-md border p-3"
            >
              <h3 v-if="showGroupTitle" class="text-sm font-medium text-foreground/90">
                {{ section.title }}
              </h3>

              <div v-if="section.displayFields.length > 0" class="space-y-3">
                <div v-for="field in section.displayFields" :key="field.key" class="space-y-2">
                  <Label v-if="field.label">{{ field.label }}</Label>
                  <div v-if="field.kind === 'image'" class="rounded-md border bg-muted/30 p-3">
                    <img
                      :src="field.src"
                      :alt="field.label || 'Identity image'"
                      class="mx-auto block h-auto w-full max-w-[256px]"
                      :width="field.width || undefined"
                      :height="field.height || undefined"
                    />
                  </div>
                  <div
                    v-else
                    class="rounded-md border bg-muted/30 px-3 py-2 text-sm font-mono whitespace-pre-line break-all"
                  >
                    {{ field.text }}
                  </div>
                  <KratosFlowMessages :messages="field.messages" />
                </div>
              </div>

              <div v-for="field in section.visibleFields" :key="field.key" class="grid gap-2">
                <Label :for="field.key">{{ field.label }}</Label>
                <div class="relative w-full items-center">
                  <template v-if="field.type === 'button'">
                    <Button
                      type="button"
                      variant="outline"
                      class="w-full justify-start h-auto whitespace-normal break-words text-left"
                      :name="field.name"
                      :value="field.value || undefined"
                      :disabled="field.disabled"
                      @click="invokeVisibleFieldAction(field)"
                    >
                      <component :is="iconForField(field.name)" class="size-4 mr-2 shrink-0" />
                      <span class="break-words">{{ field.label }}</span>
                    </Button>
                  </template>
                  <template v-else>
                    <Input
                      :id="field.key"
                      :name="field.name"
                      :type="field.type"
                      :autocomplete="field.autocomplete || undefined"
                      :required="field.required"
                      :disabled="field.disabled"
                      class="pl-10"
                      v-model="fieldValues[field.name]"
                    />
                    <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                      <component :is="iconForField(field.name)" class="size-4 text-muted-foreground" />
                    </span>
                  </template>
                </div>
                <KratosFlowMessages :messages="field.messages" />
              </div>

              <div v-if="section.buttonFields.length > 0" class="grid gap-2">
                <div v-for="field in section.buttonFields" :key="field.key" class="space-y-1">
                  <Button
                    type="button"
                    :variant="buttonFieldVariant(field)"
                    class="w-full h-auto whitespace-normal break-words"
                    :name="field.name"
                    :value="field.value || undefined"
                    :disabled="field.disabled"
                    @click="invokeVisibleFieldAction(field)"
                  >
                    <component :is="iconForField(field.name)" class="size-4 mr-2 shrink-0" />
                    <span class="break-words">{{ field.label }}</span>
                  </Button>
                  <KratosFlowMessages :messages="field.messages" />
                </div>
              </div>

              <div v-if="section.submitFields.length > 0" class="grid gap-2">
                <div v-for="submit in section.submitFields" :key="submit.key" class="space-y-1">
                  <Button
                    type="submit"
                    class="w-full h-auto whitespace-normal break-words"
                    :variant="submitVariant(submit)"
                    :name="submit.name || undefined"
                    :value="submit.value || undefined"
                    :disabled="!isReady || submit.disabled"
                  >
                    <Save class="mr-2 h-4 w-4 shrink-0" />
                    <span class="break-words">{{ submit.label }}</span>
                  </Button>
                  <KratosFlowMessages :messages="submit.messages" />
                </div>
              </div>
            </section>
          </div>

          <div v-if="!isMfaSection && displayedSubmitFields.length === 0">
            <Button type="submit" class="w-full h-auto whitespace-normal break-words" :disabled="!isReady">
              <Save class="mr-2 h-4 w-4 shrink-0" />
              <span class="break-words">{{ submitLabel || t("common.save") }}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
