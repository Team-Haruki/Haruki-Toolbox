import type { ComputedRef, InjectionKey, Ref } from "vue"

export type CommandContext = {
  search: Ref<string>
  visibleCount?: ComputedRef<number>
  updateVisibleCount?: (previous: number, next: number) => void
}

export type CommandGroupContext = {
  registerItem: (visible: boolean) => void
  updateItemVisibility: (previous: boolean, next: boolean) => void
  unregisterItem: (visible: boolean) => void
}

export const COMMAND_CONTEXT_KEY = Symbol("command-context") as InjectionKey<CommandContext>
export const COMMAND_GROUP_CONTEXT_KEY = Symbol("command-group-context") as InjectionKey<CommandGroupContext>
