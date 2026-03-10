import type { Component } from "vue"
import type { AdminUser } from "@/types/admin"
import type { UserRole } from "@/types/common"
import type { SocialPlatform } from "@/types/social-platform"
import { toValidDate } from "@/lib/date-time"
import { asRecord, readBoolean } from "@/lib/record-utils"
import {
  SOCIAL_PLATFORM_VALUES,
  isSocialPlatform as isSharedSocialPlatform,
} from "@/lib/social-platform"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import {
  LucideBot,
  LucideMessageCircle,
  LucideMonitor,
  LucideSend,
} from "lucide-vue-next"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

const USER_ROLE_SET = new Set<UserRole>(["user", "admin", "super_admin"])

const USER_ROLE_LABEL_KEYS: Record<UserRole, string> = {
  user: "adminUsers.role.user",
  admin: "adminUsers.role.admin",
  super_admin: "adminUsers.role.superAdmin",
}

const SOCIAL_PLATFORM_LABEL_KEYS: Record<SocialPlatform, string> = {
  qq: "userSettings.imAuthorization.platforms.qq",
  qqbot: "userSettings.imAuthorization.platforms.qqbot",
  discord: "userSettings.imAuthorization.platforms.discord",
  telegram: "userSettings.imAuthorization.platforms.telegram",
}

const SOCIAL_PLATFORM_ICONS: Record<SocialPlatform, Component> = {
  qq: LucideMessageCircle,
  qqbot: LucideBot,
  discord: LucideMonitor,
  telegram: LucideSend,
}

const DATE_FALLBACK = "—"

export const isSocialPlatform = isSharedSocialPlatform

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLE_SET.has(value)
}

export function roleLabel(role: UserRole, t: TranslateFn) {
  return t(USER_ROLE_LABEL_KEYS[role])
}

export function resolveServerLabel(server: string, t: TranslateFn) {
  return resolveSekaiRegionLabel(server, t)
}

export function resolveSocialPlatformLabel(platform: string, t: TranslateFn) {
  if (!isSocialPlatform(platform)) return platform
  return t(SOCIAL_PLATFORM_LABEL_KEYS[platform])
}

export function getSocialPlatforms(t: TranslateFn): Record<SocialPlatform, { label: string; icon: Component }> {
  return SOCIAL_PLATFORM_VALUES.reduce((result, platform) => {
    result[platform] = {
      label: t(SOCIAL_PLATFORM_LABEL_KEYS[platform]),
      icon: SOCIAL_PLATFORM_ICONS[platform],
    }
    return result
  }, {} as Record<SocialPlatform, { label: string; icon: Component }>)
}

export function getSocialPlatformOptions(t: TranslateFn): Array<[SocialPlatform, { label: string; icon: Component }]> {
  const platforms = getSocialPlatforms(t)
  return SOCIAL_PLATFORM_VALUES.map((platform): [SocialPlatform, { label: string; icon: Component }] => [
    platform,
    platforms[platform],
  ])
}

export function formatDateTime(value: string, locale: string, fallback = DATE_FALLBACK) {
  const date = toValidDate(value)
  if (!date) return fallback
  return date.toLocaleString(locale)
}

export function formatDate(
  value: string | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
  fallback = DATE_FALLBACK
) {
  const date = toValidDate(value)
  if (!date) return fallback
  return date.toLocaleString(locale, options)
}

export function getAllowCNMysekai(user: AdminUser): boolean | undefined {
  if (user.allowCNMysekai !== undefined) return user.allowCNMysekai

  const raw = asRecord(user)
  if (!raw || raw.allow_cn_mysekai === undefined) return undefined
  return readBoolean(raw, ["allow_cn_mysekai"])
}
