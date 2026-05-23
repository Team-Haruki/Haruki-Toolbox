<script setup lang="ts">
import { computed, ref, watch, type Component, type CSSProperties } from "vue"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
  description?: string | null
  tags?: readonly ComboboxOptionTag[]
  iconUrl?: string | null
  keywords?: readonly string[]
}

export type ComboboxOptionTag = {
  label: string
  class?: string
  style?: CSSProperties
}

const props = withDefaults(defineProps<{
  modelValue: string | null
  options: readonly ComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  clearable?: boolean
  triggerClass?: string
  contentClass?: string
  iconComponent?: Component | null
}>(), {
  disabled: false,
  clearable: true,
  triggerClass: "",
  contentClass: "",
  iconComponent: null,
})

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
}>()

const open = ref(false)
const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue) ?? null,
)

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      open.value = false
    }
  },
)

function selectOption(value: string) {
  emit("update:modelValue", props.clearable && props.modelValue === value ? null : value)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :disabled="props.disabled"
        :class="cn('w-full justify-between', props.triggerClass)"
      >
        <span class="flex min-w-0 items-center gap-2">
          <img
            v-if="selectedOption?.iconUrl"
            :src="selectedOption.iconUrl"
            alt=""
            class="size-5 shrink-0 rounded-sm object-cover"
            loading="lazy"
          >
          <component
            :is="props.iconComponent"
            v-else-if="props.iconComponent"
            class="size-4 shrink-0 text-muted-foreground"
          />
          <span
            :class="[
              'min-w-0 truncate',
              selectedOption ? 'text-foreground' : 'text-muted-foreground',
            ]"
          >
            {{ selectedOption?.label ?? props.placeholder }}
          </span>
        </span>
        <ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      :class="
        cn(
          'w-(--reka-popover-trigger-width) overflow-hidden border-white/70 bg-popover/72 p-0 shadow-[0_22px_64px_-38px_rgba(15,23,42,0.95),inset_0_1px_0_rgba(255,255,255,0.62)] supports-[backdrop-filter]:bg-popover/48 dark:border-white/12 dark:bg-slate-950/78 dark:supports-[backdrop-filter]:bg-slate-950/58',
          props.contentClass,
        )
      "
    >
      <Command class="bg-transparent">
        <CommandInput :placeholder="props.searchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ props.emptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in props.options"
              :key="option.value"
              :value="option.value"
              :keywords="[
                option.label,
                option.description ?? '',
                ...(option.tags?.map(tag => tag.label) ?? []),
                ...(option.keywords ?? []),
              ]"
              @select="selectOption"
            >
              <CheckIcon
                :class="cn('mr-1 size-4 shrink-0', props.modelValue === option.value ? 'opacity-100' : 'opacity-0')"
              />
              <img
                v-if="option.iconUrl"
                :src="option.iconUrl"
                alt=""
                class="size-6 shrink-0 rounded-sm object-cover"
                loading="lazy"
              >
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ option.label }}</span>
                <span v-if="option.tags?.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="tag in option.tags"
                    :key="tag.label"
                    :class="
                      cn(
                        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none',
                        tag.class,
                      )
                    "
                    :style="tag.style"
                  >
                    {{ tag.label }}
                  </span>
                </span>
                <span v-else-if="option.description" class="block truncate text-xs text-muted-foreground">
                  {{ option.description }}
                </span>
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
