import type { MysekaiDataPrivacySettings, SuiteDataPrivacySettings } from "@/types/store"

export type SuitePermissionKey = keyof SuiteDataPrivacySettings
export type MysekaiPermissionKey = keyof MysekaiDataPrivacySettings

export type PermissionOption<K extends string> = {
  key: K
}

export type PermissionCardOption<K extends string> = {
  key: K
  titleKey: string
  descriptionKey: string
}

const SUITE_PERMISSION_KEYS = [
  "allowPublicApi",
  "allowSakura",
  "allow8823",
  "allowResona",
  "allowLuna",
] as const satisfies readonly SuitePermissionKey[]

const MYSEKAI_PERMISSION_KEYS = [
  "allowPublicApi",
  "allowFixtureApi",
  "allow8823",
  "allowResona",
  "allowLuna",
] as const satisfies readonly MysekaiPermissionKey[]

export const SUITE_PERMISSION_TITLE_KEYS: Record<SuitePermissionKey, string> = {
  allowPublicApi: "userSettings.gameBinding.permissions.suite.allowPublicApi.title",
  allowSakura: "userSettings.gameBinding.permissions.suite.allowSakura.title",
  allow8823: "userSettings.gameBinding.permissions.suite.allow8823.title",
  allowResona: "userSettings.gameBinding.permissions.suite.allowResona.title",
  allowLuna: "userSettings.gameBinding.permissions.suite.allowLuna.title",
}

export const SUITE_PERMISSION_DESCRIPTION_KEYS: Record<SuitePermissionKey, string> = {
  allowPublicApi: "userSettings.gameBinding.permissions.suite.allowPublicApi.description",
  allowSakura: "userSettings.gameBinding.permissions.suite.allowSakura.description",
  allow8823: "userSettings.gameBinding.permissions.suite.allow8823.description",
  allowResona: "userSettings.gameBinding.permissions.suite.allowResona.description",
  allowLuna: "userSettings.gameBinding.permissions.suite.allowLuna.description",
}

export const MYSEKAI_PERMISSION_TITLE_KEYS: Record<MysekaiPermissionKey, string> = {
  allowPublicApi: "userSettings.gameBinding.permissions.mysekai.allowPublicApi.title",
  allowFixtureApi: "userSettings.gameBinding.permissions.mysekai.allowFixtureApi.title",
  allow8823: "userSettings.gameBinding.permissions.mysekai.allow8823.title",
  allowResona: "userSettings.gameBinding.permissions.mysekai.allowResona.title",
  allowLuna: "userSettings.gameBinding.permissions.mysekai.allowLuna.title",
}

export const MYSEKAI_PERMISSION_DESCRIPTION_KEYS: Record<MysekaiPermissionKey, string> = {
  allowPublicApi: "userSettings.gameBinding.permissions.mysekai.allowPublicApi.description",
  allowFixtureApi: "userSettings.gameBinding.permissions.mysekai.allowFixtureApi.description",
  allow8823: "userSettings.gameBinding.permissions.mysekai.allow8823.description",
  allowResona: "userSettings.gameBinding.permissions.mysekai.allowResona.description",
  allowLuna: "userSettings.gameBinding.permissions.mysekai.allowLuna.description",
}

export const SUITE_PERMISSION_CARD_OPTIONS: ReadonlyArray<PermissionCardOption<SuitePermissionKey>> =
  SUITE_PERMISSION_KEYS.map((key) => ({
    key,
    titleKey: SUITE_PERMISSION_TITLE_KEYS[key],
    descriptionKey: SUITE_PERMISSION_DESCRIPTION_KEYS[key],
  }))

export const MYSEKAI_PERMISSION_CARD_OPTIONS: ReadonlyArray<PermissionCardOption<MysekaiPermissionKey>> =
  MYSEKAI_PERMISSION_KEYS.map((key) => ({
    key,
    titleKey: MYSEKAI_PERMISSION_TITLE_KEYS[key],
    descriptionKey: MYSEKAI_PERMISSION_DESCRIPTION_KEYS[key],
  }))

export const SUITE_PERMISSION_OPTIONS: ReadonlyArray<PermissionOption<SuitePermissionKey>> =
  SUITE_PERMISSION_KEYS.map((key) => ({ key }))

export const MYSEKAI_PERMISSION_OPTIONS: ReadonlyArray<PermissionOption<MysekaiPermissionKey>> =
  MYSEKAI_PERMISSION_KEYS.map((key) => ({ key }))

const SUITE_PERMISSION_KEY_SET = new Set<string>(SUITE_PERMISSION_OPTIONS.map((item) => item.key))
const MYSEKAI_PERMISSION_KEY_SET = new Set<string>(MYSEKAI_PERMISSION_OPTIONS.map((item) => item.key))

export function isSuitePermissionKey(value: unknown): value is SuitePermissionKey {
  return typeof value === "string" && SUITE_PERMISSION_KEY_SET.has(value)
}

export function isMysekaiPermissionKey(value: unknown): value is MysekaiPermissionKey {
  return typeof value === "string" && MYSEKAI_PERMISSION_KEY_SET.has(value)
}
