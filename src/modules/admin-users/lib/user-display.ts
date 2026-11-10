/**
 * How a role and an account status look across the user pages: one icon and
 * one tone each, so the list, the filters and the detail header agree.
 */
import type { Component } from "vue"
import { LucideBan, LucideCircleCheck, LucideShield, LucideShieldCheck, LucideTrash2, LucideUser } from "lucide-vue-next"
import type { UserRole } from "@/types/common"
import type { UserChipTone } from "@/modules/admin-users/components/UserChip.vue"

export const USER_ROLES: readonly UserRole[] = ["user", "admin", "super_admin"]

export const ROLE_TONES: Record<UserRole, UserChipTone> = {
  user: "default",
  admin: "info",
  super_admin: "primary",
}

export const ROLE_ICONS: Record<UserRole, Component> = {
  user: LucideUser,
  admin: LucideShield,
  super_admin: LucideShieldCheck,
}

/** The role icon on its own (select items), in the chip's colour. */
export const ROLE_ICON_CLASS: Record<UserRole, string> = {
  user: "text-muted-foreground",
  admin: "text-sky-600 dark:text-sky-400",
  super_admin: "text-primary",
}

export type AccountStatus = "normal" | "banned" | "deleted"

/**
 * A legacy soft delete is stored as a ban with a marker reason, so it is
 * checked first: such an account reads "deleted", not "banned".
 */
export function resolveAccountStatus(user: { banned: boolean; deleted?: boolean }): AccountStatus {
  if (user.deleted) return "deleted"
  return user.banned ? "banned" : "normal"
}

export const STATUS_TONES: Record<AccountStatus, UserChipTone> = {
  normal: "success",
  banned: "danger",
  deleted: "warning",
}

export const STATUS_ICONS: Record<AccountStatus, Component> = {
  normal: LucideCircleCheck,
  banned: LucideBan,
  deleted: LucideTrash2,
}

/** The first letter of a name for an avatar without a picture. */
export function avatarInitial(name: string | null | undefined): string {
  const first = Array.from((name ?? "").trim())[0]
  return first ? first.toUpperCase() : "?"
}
