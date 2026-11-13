<script setup lang="ts">
/**
 * Every button of the viewer's bars: white on black, round. A variant names
 * its own size and padding (two utilities for the same property on one
 * element would leave the winner to the stylesheet's order).
 */
type ToolVariant =
  /** A 40px icon button of the main bar. */
  | "icon"
  /** A 32px icon button (zoom, top bar). */
  | "small-icon"
  /** An icon with a label. */
  | "text"
  /** The one action to finish with: dark text on a white pill. */
  | "primary"
  /** One of a row of choices; `pressed` marks the chosen one. */
  | "chip"
  /** A chip holding only an icon. */
  | "icon-chip"
  /** A number that is also a button (the zoom readout). */
  | "readout"

withDefaults(defineProps<{
  variant?: ToolVariant
  /** For a choice: whether it is the chosen one. Leave out for a plain button. */
  pressed?: boolean | null
  /** Renders a link that opens in a new tab instead of a button. */
  href?: string | null
}>(), {
  variant: "icon",
  pressed: null,
  href: null,
})

const TOOL_BASE_CLASS = "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-40"
const TOOL_QUIET_CLASS = "text-white/90 hover:bg-white/15 hover:text-white"
const TOOL_PRESSED_CLASS = "bg-white/25 text-white"
const TOOL_UNPRESSED_CLASS = "text-white/70 hover:bg-white/15 hover:text-white"

const TOOL_VARIANT_CLASS: Record<ToolVariant, string> = {
  icon: `${TOOL_QUIET_CLASS} size-10`,
  "small-icon": `${TOOL_QUIET_CLASS} size-8`,
  text: `${TOOL_QUIET_CLASS} h-10 px-3 text-sm`,
  primary: "h-10 bg-white px-3 text-sm text-black hover:bg-white/90",
  chip: "h-8 px-2.5 text-xs tabular-nums pointer-coarse:h-9 pointer-coarse:px-3",
  "icon-chip": "size-8 pointer-coarse:size-9",
  readout: `${TOOL_QUIET_CLASS} h-8 min-w-14 px-2 text-xs tabular-nums`,
}
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :type="href ? undefined : 'button'"
    :href="href ?? undefined"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    :class="[
      TOOL_BASE_CLASS,
      TOOL_VARIANT_CLASS[variant],
      variant === 'chip' || variant === 'icon-chip' ? (pressed ? TOOL_PRESSED_CLASS : TOOL_UNPRESSED_CLASS) : '',
    ]"
    :aria-pressed="pressed ?? undefined"
  >
    <slot />
  </component>
</template>
