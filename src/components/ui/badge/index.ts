import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

/**
 * Tonal pill used for statuses, types and short tags. The hue variants mirror
 * the ad-hoc `bg-<hue>-500/15 text-<hue>-700 dark:text-<hue>-300` recipe that
 * grew across the app so existing badges can migrate without visual change.
 */
export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-medium leading-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        solid: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-transparent text-foreground",
        muted: "bg-muted text-muted-foreground",
        destructive: "bg-destructive/15 text-destructive dark:text-red-300",
        emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
        orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
        sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        fuchsia: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
        cyan: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
