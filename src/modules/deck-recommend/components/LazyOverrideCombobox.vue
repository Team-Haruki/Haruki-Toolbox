<script lang="ts">
export type LazyOverrideComboboxOption = {
  value: string
  label: string
  keywords?: readonly string[]
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
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

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly LazyOverrideComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  triggerClass?: string
  contentClass?: string
}>(), {
  disabled: false,
  triggerClass: "",
  contentClass: "",
})

const emit = defineEmits<{
  "update:modelValue": [value: string]
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
  emit("update:modelValue", value)
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
        <span
          :class="[
            'min-w-0 truncate',
            selectedOption ? 'text-foreground' : 'text-muted-foreground',
          ]"
        >
          {{ selectedOption?.label ?? props.placeholder }}
        </span>
        <ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      v-if="open"
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
              :keywords="[option.label, ...(option.keywords ?? [])]"
              @select="selectOption"
            >
              <CheckIcon
                :class="cn('mr-1 size-4 shrink-0', props.modelValue === option.value ? 'opacity-100' : 'opacity-0')"
              />
              <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
