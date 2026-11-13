<script setup lang="ts">
/**
 * The scope of a list row: everything, one module, or one feature, grouped
 * in that order.
 */
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS,
  CLIENT_CONFIG_MODULE_OPTIONS,
} from "@/modules/client-config-generator/lib/client-config"
import { isAccessScope } from "@/modules/client-config-generator/lib/config-rows"

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

const { t } = useI18n()
const selectId = useId()

const moduleOptions = computed(() => CLIENT_CONFIG_MODULE_OPTIONS
  .filter((value) => value !== "all")
  .map((value) => ({
    value,
    label: t("tools.clientConfigGenerator.accessEditor.moduleScope", { value }),
  })))

const featureOptions = computed(() => CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.map((value) => ({
  value,
  label: t("tools.clientConfigGenerator.accessEditor.featureScope", { value }),
})))

function handleUpdate(value: unknown) {
  emit("update:modelValue", isAccessScope(value) ? value : "all")
}
</script>

<template>
  <Label :id="`${selectId}-label`" :for="selectId" class="sr-only">
    {{ t("tools.clientConfigGenerator.accessEditor.scopePlaceholder") }}
  </Label>
  <Select :id="selectId" :model-value="modelValue" @update:model-value="handleUpdate">
    <SelectTrigger class="w-full" :aria-labelledby="`${selectId}-label`">
      <SelectValue :placeholder="t('tools.clientConfigGenerator.accessEditor.scopePlaceholder')" />
    </SelectTrigger>
    <SelectContent class="max-h-72">
      <SelectGroup>
        <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.globalGroup") }}</SelectLabel>
        <SelectItem value="all">{{ t("tools.clientConfigGenerator.accessEditor.globalScope") }}</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.moduleGroup") }}</SelectLabel>
        <SelectItem v-for="option in moduleOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>{{ t("tools.clientConfigGenerator.accessEditor.featureGroup") }}</SelectLabel>
        <SelectItem v-for="option in featureOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
