import type { SocialPlatform } from "@/types/social-platform"

export const SOCIAL_PLATFORM_VALUES: readonly SocialPlatform[] = ["qq", "qqbot", "discord", "telegram"]

const SOCIAL_PLATFORM_SET = new Set<string>(SOCIAL_PLATFORM_VALUES)

export const DEFAULT_SOCIAL_PLATFORM: SocialPlatform = "qq"

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
    qq: "QQ",
    qqbot: "QQ Official Bot",
    discord: "Discord",
    telegram: "Telegram",
}

export function isSocialPlatform(value: unknown): value is SocialPlatform {
    return typeof value === "string" && SOCIAL_PLATFORM_SET.has(value)
}

/**
 * Whether the toolbox account's HarukiBot social binding is a verified QQ
 * number — the prerequisite for adding game bindings and for any MySekai
 * upload feature.
 */
export function isVerifiedQQBinding(
    info: { platform: string; verified: boolean } | null | undefined,
): boolean {
    return info?.platform === "qq" && info.verified === true
}
