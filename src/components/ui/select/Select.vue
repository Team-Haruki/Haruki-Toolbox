<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from "reka-ui"
import { SelectRoot, useForwardPropsEmits } from "reka-ui"

// The root renders no element of its own (reka's SelectRoot is a provider),
// so attributes such as `id` / `aria-label` written on `<Select>` for markup
// linters have nowhere to land; declare that instead of letting Vue warn.
defineOptions({ inheritAttrs: false })

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <SelectRoot
    data-slot="select"
    v-bind="forwarded"
  >
    <slot />
  </SelectRoot>
</template>
