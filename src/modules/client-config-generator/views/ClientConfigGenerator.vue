<script setup lang="ts">
import { computed, reactive } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileSliders,
  KeyRound,
  ListChecks,
  Plus,
  RotateCcw,
  Route,
  Shield,
  SlidersHorizontal,
  TerminalSquare,
  Trash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { copyTextToClipboard } from "@/lib/clipboard"
import type { ClientFeaturePolicyMode } from "@/modules/client-config-generator/lib/client-config"
import {
  buildClientConfigYaml,
  CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS,
  CLIENT_CONFIG_MODULE_OPTIONS,
  cloneDefaultClientConfigForm,
  parseNumberList,
} from "@/modules/client-config-generator/lib/client-config"

const { t } = useI18n()

interface FeaturePolicyRow {
  key: string
  scope: string
  mode: ClientFeaturePolicyMode
}

interface ModuleRow {
  key: string
  module: string
}

interface ScopedAccessRow {
  key: string
  scope: string
  value: string | number
}

interface AccessIdRow {
  key: string
  value: string | number
}

const form = reactive(cloneDefaultClientConfigForm())
let rowSeed = 0

const moduleRows = reactive<ModuleRow[]>([createModuleRow("all")])
const featurePolicyRows = reactive<FeaturePolicyRow[]>([])
const blacklistRows = reactive<ScopedAccessRow[]>([createScopedAccessRow()])
const whitelistRows = reactive<ScopedAccessRow[]>([createScopedAccessRow()])
const userBlacklistRows = reactive<ScopedAccessRow[]>([createScopedAccessRow()])
const botAdminRows = reactive<AccessIdRow[]>([createAccessIdRow()])

const generated = computed(() => buildClientConfigYaml({
  ...form,
  enableModulesText: serializeModuleRows(moduleRows),
  featurePolicyModesText: serializeFeaturePolicyRows(featurePolicyRows),
  blacklistsText: serializeScopedAccessRows(blacklistRows),
  whitelistsText: serializeScopedAccessRows(whitelistRows),
  userBlacklistsText: serializeScopedAccessRows(userBlacklistRows),
  botAdminsText: serializeAccessIdRows(botAdminRows),
}))
const enabledModuleCount = computed(() => generated.value.parsed.enableModules.length)
const adminCount = computed(() => generated.value.parsed.botAdmins.length)
const scopedPolicyCount = computed(() => Object.keys(generated.value.parsed.featurePolicyModes).length)
const pinnedEndpoint = computed(() => form.serverEndpointOverride.trim().length > 0)
const usesDynamicRouting = computed(() => !pinnedEndpoint.value)

const textareaClass = "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"

const toggleItems = computed(() => [
  {
    key: "enableHelp",
    label: t("tools.clientConfigGenerator.toggles.enableHelp.label"),
    description: t("tools.clientConfigGenerator.toggles.enableHelp.description"),
  },
  {
    key: "enableCN",
    label: t("tools.clientConfigGenerator.toggles.enableCN.label"),
    description: t("tools.clientConfigGenerator.toggles.enableCN.description"),
  },
  {
    key: "enableReplyMessage",
    label: t("tools.clientConfigGenerator.toggles.enableReplyMessage.label"),
    description: t("tools.clientConfigGenerator.toggles.enableReplyMessage.description"),
  },
] as const)

const moduleOptions = computed(() => CLIENT_CONFIG_MODULE_OPTIONS.map((value) => ({
  value,
  label: value === "all"
    ? t("tools.clientConfigGenerator.moduleSelector.allModules")
    : t("tools.clientConfigGenerator.moduleSelector.moduleOption", { value }),
})))

const featureScopeOptions = computed(() => CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.map((value) => ({
  value,
  label: value,
})))

const globalAccessScopeOption = computed(() => ({
  value: "all",
  label: t("tools.clientConfigGenerator.accessEditor.globalScope"),
}))

const moduleAccessScopeOptions = computed(() => CLIENT_CONFIG_MODULE_OPTIONS
  .filter((value) => value !== "all")
  .map((value) => ({
    value,
    label: t("tools.clientConfigGenerator.accessEditor.moduleScope", { value }),
  })))

const featureAccessScopeOptions = computed(() => CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.map((value) => ({
  value,
  label: t("tools.clientConfigGenerator.accessEditor.featureScope", { value }),
})))

const accessScopeOptions = computed(() => [
  globalAccessScopeOption.value,
  ...moduleAccessScopeOptions.value,
  ...featureAccessScopeOptions.value,
])

const scopedAccessEditors = computed(() => [
  {
    key: "blacklists",
    label: t("tools.clientConfigGenerator.fields.blacklists.label"),
    description: t("tools.clientConfigGenerator.accessEditor.blacklistsDescription"),
    rows: blacklistRows,
    valueLabel: t("tools.clientConfigGenerator.accessEditor.groupIdLabel"),
    valuePlaceholder: t("tools.clientConfigGenerator.accessEditor.groupIdPlaceholder"),
  },
  {
    key: "whitelists",
    label: t("tools.clientConfigGenerator.fields.whitelists.label"),
    description: t("tools.clientConfigGenerator.accessEditor.whitelistsDescription"),
    rows: whitelistRows,
    valueLabel: t("tools.clientConfigGenerator.accessEditor.groupIdLabel"),
    valuePlaceholder: t("tools.clientConfigGenerator.accessEditor.groupIdPlaceholder"),
  },
  {
    key: "userBlacklists",
    label: t("tools.clientConfigGenerator.fields.userBlacklists.label"),
    description: t("tools.clientConfigGenerator.accessEditor.userBlacklistsDescription"),
    rows: userBlacklistRows,
    valueLabel: t("tools.clientConfigGenerator.accessEditor.userIdLabel"),
    valuePlaceholder: t("tools.clientConfigGenerator.accessEditor.userIdPlaceholder"),
  },
] as const)

function createFeaturePolicyRow(scope = "", mode: ClientFeaturePolicyMode = "blacklist"): FeaturePolicyRow {
  return {
    key: `feature-${rowSeed++}`,
    scope,
    mode,
  }
}

function createModuleRow(module = ""): ModuleRow {
  return {
    key: `module-${rowSeed++}`,
    module,
  }
}

function createScopedAccessRow(scope = "all", value: string | number = ""): ScopedAccessRow {
  return {
    key: `scoped-access-${rowSeed++}`,
    scope,
    value,
  }
}

function createAccessIdRow(value: string | number = ""): AccessIdRow {
  return {
    key: `access-id-${rowSeed++}`,
    value,
  }
}

function resetForm() {
  Object.assign(form, cloneDefaultClientConfigForm())
  moduleRows.splice(0, moduleRows.length, createModuleRow("all"))
  featurePolicyRows.splice(0, featurePolicyRows.length)
  blacklistRows.splice(0, blacklistRows.length, createScopedAccessRow())
  whitelistRows.splice(0, whitelistRows.length, createScopedAccessRow())
  userBlacklistRows.splice(0, userBlacklistRows.length, createScopedAccessRow())
  botAdminRows.splice(0, botAdminRows.length, createAccessIdRow())
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
  link.download = "configs.yaml"
  link.click()
  URL.revokeObjectURL(url)
  toast.success(t("tools.clientConfigGenerator.toast.downloadSuccess"))
}

function updateRunMode(value: unknown) {
  form.runMode = value === "whitelist" ? "whitelist" : "blacklist"
}

function updateFeaturePolicyMode(row: FeaturePolicyRow, value: unknown) {
  row.mode = value === "whitelist" ? "whitelist" : "blacklist"
}

function updateFeaturePolicyScope(row: FeaturePolicyRow, value: unknown) {
  row.scope = isFeatureScopeOption(value) ? value : ""
}

function updateModuleRow(row: ModuleRow, value: unknown) {
  row.module = isModuleOption(value) ? value : ""
  if (row.module === "all") {
    moduleRows.splice(0, moduleRows.length, row)
    return
  }

  removeAllModuleRows()
}

function updateScopedAccessScope(row: ScopedAccessRow, value: unknown) {
  row.scope = isAccessScopeOption(value) ? value : "all"
}

function updateToggle(key: typeof toggleItems.value[number]["key"], value: boolean) {
  form[key] = value
}

function addFeaturePolicyRow() {
  featurePolicyRows.push(createFeaturePolicyRow())
}

function removeFeaturePolicyRow(key: string) {
  const index = featurePolicyRows.findIndex((row) => row.key === key)
  if (index >= 0) {
    featurePolicyRows.splice(index, 1)
  }
}

function addModuleRow() {
  if (moduleRows.some((row) => row.module === "all")) {
    moduleRows.splice(0, moduleRows.length, createModuleRow())
    return
  }

  moduleRows.push(createModuleRow())
}

function removeModuleRow(key: string) {
  removeRow(moduleRows, key, () => createModuleRow("all"))
}

function addScopedAccessRow(rows: ScopedAccessRow[]) {
  rows.push(createScopedAccessRow())
}

function removeScopedAccessRow(rows: ScopedAccessRow[], key: string) {
  removeRow(rows, key, () => createScopedAccessRow())
}

function addAccessIdRow() {
  botAdminRows.push(createAccessIdRow())
}

function removeAccessIdRow(key: string) {
  removeRow(botAdminRows, key, () => createAccessIdRow())
}

function removeRow<T extends { key: string }>(rows: T[], key: string, createBlank: () => T) {
  if (rows.length <= 1) {
    rows.splice(0, rows.length, createBlank())
    return
  }

  const index = rows.findIndex((row) => row.key === key)
  if (index >= 0) {
    rows.splice(index, 1)
  }
}

function serializeFeaturePolicyRows(rows: FeaturePolicyRow[]): string {
  return rows
    .map((row) => ({
      scope: row.scope.trim(),
      mode: row.mode,
    }))
    .filter((row) => row.scope)
    .map((row) => `${row.scope}: ${row.mode}`)
    .join("\n")
}

function serializeModuleRows(rows: ModuleRow[]): string {
  const modules = Array.from(new Set(
    rows
      .map((row) => row.module.trim())
      .filter(Boolean),
  ))

  if (modules.length === 0 || modules.includes("all")) {
    return "all"
  }

  return modules.join("\n")
}

function serializeScopedAccessRows(rows: ScopedAccessRow[]): string {
  const grouped = new Map<string, number[]>()

  for (const row of rows) {
    const ids = parseNumberList(row.value)
    if (ids.length === 0) {
      continue
    }

    const scope = row.scope.trim() || "all"
    grouped.set(scope, [...(grouped.get(scope) ?? []), ...ids])
  }

  return Array.from(grouped.entries())
    .map(([scope, ids]) => `${scope}: ${Array.from(new Set(ids)).join(", ")}`)
    .join("\n")
}

function serializeAccessIdRows(rows: AccessIdRow[]): string {
  return Array.from(new Set(rows.flatMap((row) => parseNumberList(row.value))))
    .join("\n")
}

function isModuleOption(value: unknown): value is typeof CLIENT_CONFIG_MODULE_OPTIONS[number] {
  return typeof value === "string" && CLIENT_CONFIG_MODULE_OPTIONS.includes(value as typeof CLIENT_CONFIG_MODULE_OPTIONS[number])
}

function isFeatureScopeOption(value: unknown): value is typeof CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS[number] {
  return typeof value === "string" && CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.includes(value as typeof CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS[number])
}

function isAccessScopeOption(value: unknown): value is string {
  return typeof value === "string"
    && accessScopeOptions.value.some((option) => option.value === value)
}

function removeAllModuleRows() {
  for (let index = moduleRows.length - 1; index >= 0; index -= 1) {
    if (moduleRows[index].module === "all") {
      moduleRows.splice(index, 1)
    }
  }
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-0 py-4">
    <div class="mx-auto w-full max-w-7xl">
      <Card class="gap-0 rounded-lg py-0 shadow-sm xl:rounded-xl">
        <CardHeader class="border-b px-3 py-4 sm:px-5 xl:px-6">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 space-y-1.5">
              <CardTitle class="flex items-center gap-2 text-xl">
                <FileSliders class="size-5" />
                {{ t("tools.clientConfigGenerator.title") }}
              </CardTitle>
              <CardDescription class="max-w-4xl text-sm leading-relaxed">
                {{ t("tools.clientConfigGenerator.description") }}
              </CardDescription>
            </div>
          </div>

          <section class="mt-4 rounded-md bg-muted/30 px-3 py-3">
            <div class="flex items-start gap-2.5">
              <Clipboard class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div class="min-w-0 space-y-1">
                <h2 class="text-sm font-semibold">{{ t("tools.clientConfigGenerator.notes.title") }}</h2>
                <p class="text-sm leading-relaxed text-muted-foreground">
                  {{ t("tools.clientConfigGenerator.notes.description") }}
                </p>
                <div class="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs leading-relaxed text-muted-foreground">
                  <span>{{ t("tools.clientConfigGenerator.notes.items.dynamicRouting") }}</span>
                  <span>{{ t("tools.clientConfigGenerator.notes.items.accessToken") }}</span>
                  <span>{{ t("tools.clientConfigGenerator.notes.items.listSyntax") }}</span>
                </div>
              </div>
            </div>
          </section>
        </CardHeader>

        <CardContent class="px-3 py-4 sm:px-5 xl:px-6 xl:py-5">
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start">
            <div class="min-w-0 space-y-6">
              <section class="space-y-4">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <KeyRound class="size-4" />
                    {{ t("tools.clientConfigGenerator.sections.identity.title") }}
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.sections.identity.description") }}
                  </p>
                </div>

                <div class="grid gap-3 lg:grid-cols-3">
                  <div class="grid gap-1.5">
                    <Label for="client-host">{{ t("tools.clientConfigGenerator.fields.host.label") }}</Label>
                    <Input
                      id="client-host"
                      v-model="form.host"
                      :placeholder="t('tools.clientConfigGenerator.fields.host.placeholder')"
                    />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-port">{{ t("tools.clientConfigGenerator.fields.port.label") }}</Label>
                    <Input id="client-port" v-model.number="form.port" type="number" min="1" max="65535" />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-control-port">
                      {{ t("tools.clientConfigGenerator.fields.controlApiPort.label") }}
                    </Label>
                    <Input
                      id="client-control-port"
                      v-model.number="form.controlApiPort"
                      type="number"
                      min="0"
                      max="65535"
                    />
                  </div>
                </div>

                <div class="grid gap-3 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                  <div class="grid gap-1.5">
                    <Label for="client-bot-id">{{ t("tools.clientConfigGenerator.fields.botId.label") }}</Label>
                    <Input
                      id="client-bot-id"
                      v-model.number="form.botId"
                      type="number"
                      min="0"
                      :placeholder="t('tools.clientConfigGenerator.fields.botId.placeholder')"
                    />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-credential">{{ t("tools.clientConfigGenerator.fields.credential.label") }}</Label>
                    <Input
                      id="client-credential"
                      v-model="form.credential"
                      :placeholder="t('tools.clientConfigGenerator.fields.credential.placeholder')"
                    />
                  </div>
                </div>

                <div class="grid gap-3 lg:grid-cols-2">
                  <div class="grid gap-1.5">
                    <Label for="client-auth-key">
                      {{ t("tools.clientConfigGenerator.fields.authEncryptionKey.label") }}
                    </Label>
                    <Input
                      id="client-auth-key"
                      v-model="form.authEncryptionKey"
                      :placeholder="t('tools.clientConfigGenerator.fields.authEncryptionKey.placeholder')"
                    />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-noise-key">
                      {{ t("tools.clientConfigGenerator.fields.noiseServerPubkey.label") }}
                    </Label>
                    <Input
                      id="client-noise-key"
                      v-model="form.noiseServerPubkey"
                      :placeholder="t('tools.clientConfigGenerator.fields.noiseServerPubkey.placeholder')"
                    />
                  </div>
                </div>

                <div class="grid gap-3 rounded-md bg-muted/25 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div class="min-w-0 space-y-1">
                    <Label class="text-sm">{{ t("tools.clientConfigGenerator.fields.controlApiAccessToken.label") }}</Label>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.controlApiAccessToken.description") }}
                    </p>
                  </div>
                  <Switch
                    :model-value="form.useControlApiAccessToken"
                    @update:model-value="form.useControlApiAccessToken = Boolean($event)"
                  />
                  <Input
                    v-if="form.useControlApiAccessToken"
                    v-model="form.controlApiAccessToken"
                    class="sm:col-span-2"
                    :placeholder="t('tools.clientConfigGenerator.fields.controlApiAccessToken.placeholder')"
                  />
                </div>
              </section>

              <section class="space-y-4 border-t pt-5">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <Route class="size-4" />
                    {{ t("tools.clientConfigGenerator.sections.routing.title") }}
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.sections.routing.description") }}
                  </p>
                </div>

                <div class="grid gap-3 lg:grid-cols-2">
                  <div class="grid gap-1.5">
                    <Label for="client-endpoint-override">
                      {{ t("tools.clientConfigGenerator.fields.serverEndpointOverride.label") }}
                    </Label>
                    <Input
                      id="client-endpoint-override"
                      v-model="form.serverEndpointOverride"
                      :placeholder="t('tools.clientConfigGenerator.fields.serverEndpointOverride.placeholder')"
                    />
                    <p class="text-xs text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.serverEndpointOverride.help") }}
                    </p>
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-routing-url">
                      {{ t("tools.clientConfigGenerator.fields.routingConfigURL.label") }}
                    </Label>
                    <Input
                      id="client-routing-url"
                      v-model="form.routingConfigURL"
                      :placeholder="t('tools.clientConfigGenerator.fields.routingConfigURL.placeholder')"
                    />
                    <p class="text-xs text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.routingConfigURL.help") }}
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
                  :class="pinnedEndpoint ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'"
                >
                  <CheckCircle2 class="mt-0.5 size-4 shrink-0" />
                  <div class="min-w-0">
                    <div class="font-medium">
                      {{ usesDynamicRouting ? t("tools.clientConfigGenerator.routingState.dynamic") : t("tools.clientConfigGenerator.routingState.pinned") }}
                    </div>
                    <p class="mt-0.5 text-xs leading-relaxed opacity-90">
                      {{ usesDynamicRouting ? t("tools.clientConfigGenerator.routingState.dynamicDescription") : t("tools.clientConfigGenerator.routingState.pinnedDescription") }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="space-y-4 border-t pt-5">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <SlidersHorizontal class="size-4" />
                    {{ t("tools.clientConfigGenerator.sections.runtime.title") }}
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.sections.runtime.description") }}
                  </p>
                </div>

                <div class="grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
                  <div class="grid gap-1.5">
                    <Label>{{ t("tools.clientConfigGenerator.fields.runMode.label") }}</Label>
                    <Select :model-value="form.runMode" @update:model-value="updateRunMode">
                      <SelectTrigger class="w-full">
                        <SelectValue :placeholder="t('tools.clientConfigGenerator.fields.runMode.placeholder')" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blacklist">{{ t("tools.clientConfigGenerator.runMode.blacklist") }}</SelectItem>
                        <SelectItem value="whitelist">{{ t("tools.clientConfigGenerator.runMode.whitelist") }}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="grid gap-2 sm:grid-cols-3">
                    <div
                      v-for="item in toggleItems"
                      :key="item.key"
                      class="flex min-h-20 items-start gap-2 rounded-md bg-muted/25 px-3 py-2.5"
                    >
                      <Checkbox
                        :id="`client-toggle-${item.key}`"
                        :model-value="form[item.key]"
                        @update:model-value="updateToggle(item.key, Boolean($event))"
                      />
                      <div class="grid gap-0.5">
                        <Label :for="`client-toggle-${item.key}`" class="cursor-pointer text-sm">
                          {{ item.label }}
                        </Label>
                        <p class="text-xs leading-relaxed text-muted-foreground">{{ item.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                  <div class="flex items-start justify-between gap-3 rounded-md bg-muted/25 p-3">
                    <div class="min-w-0 space-y-1">
                      <Label class="text-sm">
                        {{ t("tools.clientConfigGenerator.fields.enableGroupCommandLimit.label") }}
                      </Label>
                      <p class="text-xs leading-relaxed text-muted-foreground">
                        {{ t("tools.clientConfigGenerator.fields.enableGroupCommandLimit.description") }}
                      </p>
                    </div>
                    <Switch
                      :model-value="form.enableGroupCommandLimit"
                      @update:model-value="form.enableGroupCommandLimit = Boolean($event)"
                    />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-hour-limit">
                      {{ t("tools.clientConfigGenerator.fields.globalCommandHourlyLimit.label") }}
                    </Label>
                    <Input id="client-hour-limit" v-model.number="form.globalCommandHourlyLimit" type="number" min="0" />
                  </div>
                  <div class="grid gap-1.5">
                    <Label for="client-day-limit">
                      {{ t("tools.clientConfigGenerator.fields.globalCommandDailyLimit.label") }}
                    </Label>
                    <Input id="client-day-limit" v-model.number="form.globalCommandDailyLimit" type="number" min="0" />
                  </div>
                </div>

                <div class="grid gap-1.5">
                  <Label for="client-help-content">{{ t("tools.clientConfigGenerator.fields.helpContent.label") }}</Label>
                  <textarea
                    id="client-help-content"
                    v-model="form.helpContent"
                    :placeholder="t('tools.clientConfigGenerator.fields.helpContent.placeholder')"
                    :class="textareaClass"
                  />
                </div>
              </section>

              <section class="space-y-4 border-t pt-5">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <ListChecks class="size-4" />
                    {{ t("tools.clientConfigGenerator.sections.modules.title") }}
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.sections.modules.description") }}
                  </p>
                </div>

                <div class="grid gap-3 lg:grid-cols-2 lg:items-stretch">
                  <div class="grid gap-2 lg:grid-rows-[2.5rem_minmax(12rem,1fr)_auto]">
                    <div class="flex min-h-10 items-center justify-between gap-2">
                      <Label>{{ t("tools.clientConfigGenerator.fields.enableModules.label") }}</Label>
                      <Button type="button" variant="outline" size="sm" class="h-9 gap-1.5" @click="addModuleRow">
                        <Plus class="size-3.5" />
                        {{ t("tools.clientConfigGenerator.actions.addModule") }}
                      </Button>
                    </div>
                    <div class="grid min-h-48 content-start gap-2 rounded-md border bg-muted/10 p-2">
                      <div
                        v-for="row in moduleRows"
                        :key="row.key"
                        class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2.25rem]"
                      >
                        <Select :model-value="row.module" @update:model-value="updateModuleRow(row, $event)">
                          <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('tools.clientConfigGenerator.moduleSelector.placeholder')" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="option in moduleOptions"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="size-9 text-muted-foreground"
                          :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
                          @click="removeModuleRow(row.key)"
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.enableModules.help") }}
                    </p>
                  </div>
                  <div class="grid gap-2 lg:grid-rows-[2.5rem_minmax(12rem,1fr)_auto]">
                    <div class="flex min-h-10 items-center justify-between gap-2">
                      <Label>{{ t("tools.clientConfigGenerator.fields.featurePolicyModes.label") }}</Label>
                      <Button type="button" variant="outline" size="sm" class="h-9 gap-1.5" @click="addFeaturePolicyRow">
                        <Plus class="size-3.5" />
                        {{ t("tools.clientConfigGenerator.actions.addFeaturePolicy") }}
                      </Button>
                    </div>
                    <div class="grid min-h-48 content-start gap-2 rounded-md border bg-muted/10 p-2">
                      <div
                        v-if="featurePolicyRows.length === 0"
                        class="flex min-h-36 items-center rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground"
                      >
                        {{ t("tools.clientConfigGenerator.policyEditor.empty") }}
                      </div>
                      <div
                        v-for="row in featurePolicyRows"
                        :key="row.key"
                        class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_2.25rem]"
                      >
                        <Select :model-value="row.scope" @update:model-value="updateFeaturePolicyScope(row, $event)">
                          <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('tools.clientConfigGenerator.policyEditor.scopePlaceholder')" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="option in featureScopeOptions"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select :model-value="row.mode" @update:model-value="updateFeaturePolicyMode(row, $event)">
                          <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('tools.clientConfigGenerator.policyEditor.modePlaceholder')" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blacklist">{{ t("tools.clientConfigGenerator.runMode.blacklist") }}</SelectItem>
                            <SelectItem value="whitelist">{{ t("tools.clientConfigGenerator.runMode.whitelist") }}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="size-9 text-muted-foreground"
                          :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
                          @click="removeFeaturePolicyRow(row.key)"
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p class="text-xs leading-relaxed text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.featurePolicyModes.help") }}
                    </p>
                  </div>
                </div>
              </section>

              <section class="space-y-4 border-t pt-5">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <Shield class="size-4" />
                    {{ t("tools.clientConfigGenerator.sections.access.title") }}
                  </h2>
                  <p class="text-sm text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.sections.access.description") }}
                  </p>
                </div>

                <div class="grid gap-3 lg:grid-cols-2">
                  <div
                    v-for="editor in scopedAccessEditors"
                    :key="editor.key"
                    class="grid gap-1.5"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <Label>{{ editor.label }}</Label>
                      <Button type="button" variant="outline" size="sm" class="h-8 gap-1.5" @click="addScopedAccessRow(editor.rows)">
                        <Plus class="size-3.5" />
                        {{ t("tools.clientConfigGenerator.actions.addAccessRow") }}
                      </Button>
                    </div>
                    <div class="grid gap-2 rounded-md border bg-muted/10 p-2">
                      <div
                        v-for="row in editor.rows"
                        :key="row.key"
                        class="grid gap-2 sm:grid-cols-[minmax(7rem,0.85fr)_minmax(8rem,1fr)_2.25rem]"
                      >
                        <Select :model-value="row.scope" @update:model-value="updateScopedAccessScope(row, $event)">
                          <SelectTrigger class="w-full">
                            <SelectValue :placeholder="t('tools.clientConfigGenerator.accessEditor.scopePlaceholder')" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.globalGroup") }}</SelectLabel>
                              <SelectItem :value="globalAccessScopeOption.value">
                                {{ globalAccessScopeOption.label }}
                              </SelectItem>
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.moduleGroup") }}</SelectLabel>
                              <SelectItem
                                v-for="option in moduleAccessScopeOptions"
                                :key="option.value"
                                :value="option.value"
                              >
                                {{ option.label }}
                              </SelectItem>
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.featureGroup") }}</SelectLabel>
                              <SelectItem
                                v-for="option in featureAccessScopeOptions"
                                :key="option.value"
                                :value="option.value"
                              >
                                {{ option.label }}
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Input
                          v-model="row.value"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          :aria-label="editor.valueLabel"
                          :placeholder="editor.valuePlaceholder"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="size-9 text-muted-foreground"
                          :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
                          @click="removeScopedAccessRow(editor.rows, row.key)"
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p class="text-xs leading-relaxed text-muted-foreground">{{ editor.description }}</p>
                  </div>

                  <div class="grid gap-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <Label>{{ t("tools.clientConfigGenerator.fields.botAdmins.label") }}</Label>
                      <Button type="button" variant="outline" size="sm" class="h-8 gap-1.5" @click="addAccessIdRow">
                        <Plus class="size-3.5" />
                        {{ t("tools.clientConfigGenerator.actions.addBotAdmin") }}
                      </Button>
                    </div>
                    <div class="grid gap-2 rounded-md border bg-muted/10 p-2">
                      <div
                        v-for="row in botAdminRows"
                        :key="row.key"
                        class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_2.25rem]"
                      >
                        <Input
                          v-model="row.value"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          :aria-label="t('tools.clientConfigGenerator.fields.botAdmins.label')"
                          :placeholder="t('tools.clientConfigGenerator.accessEditor.botAdminPlaceholder')"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="size-9 text-muted-foreground"
                          :aria-label="t('tools.clientConfigGenerator.actions.removeRow')"
                          @click="removeAccessIdRow(row.key)"
                        >
                          <Trash2 class="size-4" />
                        </Button>
                      </div>
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ t("tools.clientConfigGenerator.fields.botAdmins.help") }}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <aside class="min-w-0 xl:sticky xl:top-20">
              <section class="rounded-md border bg-muted/10 p-3 xl:p-4">
                <div class="space-y-1">
                  <h2 class="flex items-center gap-2 text-base font-semibold">
                    <TerminalSquare class="size-4" />
                    {{ t("tools.clientConfigGenerator.preview.title") }}
                  </h2>
                  <p class="text-sm leading-relaxed text-muted-foreground">
                    {{ t("tools.clientConfigGenerator.preview.description") }}
                  </p>
                </div>

                <div class="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  <Button type="button" class="h-9 gap-2" @click="copyYaml">
                    <Copy class="size-4" />
                    {{ t("tools.clientConfigGenerator.actions.copy") }}
                  </Button>
                  <Button type="button" variant="outline" class="h-9 gap-2" @click="resetForm">
                    <RotateCcw class="size-4" />
                    {{ t("tools.clientConfigGenerator.actions.reset") }}
                  </Button>
                  <Button type="button" variant="outline" class="h-9 gap-2" @click="downloadYaml">
                    <Download class="size-4" />
                    {{ t("tools.clientConfigGenerator.actions.download") }}
                  </Button>
                </div>

                <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{{ t("tools.clientConfigGenerator.summary.modules") }} {{ enabledModuleCount }}</span>
                  <span>{{ t("tools.clientConfigGenerator.summary.admins") }} {{ adminCount }}</span>
                  <span>{{ t("tools.clientConfigGenerator.summary.scopes") }} {{ scopedPolicyCount }}</span>
                </div>

                <pre class="mt-3 max-h-[36rem] overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-relaxed text-slate-100 shadow-inner"><code>{{ generated.yaml }}</code></pre>
              </section>
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
