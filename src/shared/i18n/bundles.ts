import type { I18nBundle } from "@/shared/i18n"

type BundleRule = {
  prefixes: readonly string[]
  bundles: readonly I18nBundle[]
}

// Path-prefix → message bundles. `core` is always loaded at boot and never
// listed here. Cross-feature dependencies discovered by the namespace usage
// audit are encoded per rule (e.g. admin renders upload-type labels from the
// tools namespace and permission meta from user-settings).
const BUNDLE_RULES: readonly BundleRule[] = [
  { prefixes: ["/deck-recommend", "/event-planner"], bundles: ["deck"] },
  { prefixes: ["/rank-border"], bundles: ["rank"] },
  {
    prefixes: [
      "/pt-calculator",
      "/pt_calc",
      "/upload-data",
      "/upload_suite",
      "/upload_mysekai",
      "/ios-modules",
      "/client-config-generator",
      "/client_config_generator",
      "/haruki-bot-neo",
    ],
    bundles: ["tools"],
  },
  { prefixes: ["/user", "/oauth2"], bundles: ["user-settings"] },
  { prefixes: ["/admin"], bundles: ["admin", "tickets", "tools", "user-settings"] },
  { prefixes: ["/tickets"], bundles: ["tickets"] },
  {
    prefixes: ["/about", "/privacy", "/tos", "/friend-groups", "/friend-links", "/sponsors"],
    bundles: ["public-pages"],
  },
]

export function resolveI18nBundlesForPath(path: string): I18nBundle[] {
  const bundles = new Set<I18nBundle>()
  for (const rule of BUNDLE_RULES) {
    if (rule.prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))) {
      for (const bundle of rule.bundles) {
        bundles.add(bundle)
      }
    }
  }
  return [...bundles]
}
