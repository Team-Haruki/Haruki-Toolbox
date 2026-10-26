import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type { InjectionKey, Ref } from "vue"

export { default as ToggleGroup } from "./ToggleGroup.vue"
export { default as ToggleGroupItem } from "./ToggleGroupItem.vue"

/**
 * `chip`: free-standing pills (multi-select filter rows).
 * `segment`: joined buttons that read as one segmented control (view / art
 * mode switches).
 */
export const toggleGroupVariants = cva("", {
  variants: {
    variant: {
      chip: "flex flex-wrap items-center gap-1.5",
      segment: "inline-flex items-center rounded-md border bg-background p-0.5 shadow-xs dark:bg-input/30",
    },
  },
  defaultVariants: {
    variant: "chip",
  },
})

export const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_img]:pointer-events-none",
  {
    variants: {
      variant: {
        // Touch devices get a 36 px tall pill (`size="sm"` is 28 px): the
        // filter rows are tapped far more often than they are clicked.
        chip: "rounded-full border border-border bg-transparent text-foreground hover:bg-muted data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground [@media(pointer:coarse)]:min-h-9 [@media(pointer:coarse)]:px-3",
        segment: "rounded-[calc(var(--radius-md)-2px)] border border-transparent text-muted-foreground hover:text-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground data-[state=on]:shadow-xs",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        default: "h-8 px-3 text-xs sm:text-sm",
      },
    },
    defaultVariants: {
      variant: "chip",
      size: "sm",
    },
  },
)

export type ToggleGroupVariants = VariantProps<typeof toggleGroupVariants>
export type ToggleGroupItemVariants = VariantProps<typeof toggleGroupItemVariants>

export type ToggleGroupContext = {
  variant: Ref<NonNullable<ToggleGroupVariants["variant"]>>
  size: Ref<NonNullable<ToggleGroupItemVariants["size"]>>
}

export const TOGGLE_GROUP_CONTEXT: InjectionKey<ToggleGroupContext> = Symbol("toggle-group")
