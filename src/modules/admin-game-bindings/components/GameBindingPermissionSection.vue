<script setup lang="ts">
import { useId } from "vue"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { PermissionOption } from "@/lib/game-binding-permission-meta"

interface Props {
  title: string
  options: ReadonlyArray<PermissionOption<string>>
  values: Record<string, boolean>
}

const props = defineProps<Props>()
const fieldIdPrefix = useId()
const emit = defineEmits<{
  (event: "update", payload: { key: string; value: boolean }): void
}>()

function handleUpdate(key: string, value: boolean) {
  emit("update", { key, value })
}

function fieldId(key: string): string {
  return `${fieldIdPrefix}-${key}`
}
</script>

<template>
  <div class="border rounded-lg p-3">
    <h3 class="font-semibold text-sm">{{ props.title }}</h3>
    <div class="grid gap-2 mt-2">
      <div v-for="option in props.options" :key="option.key" class="flex items-center justify-between">
        <Label :for="fieldId(option.key)" class="text-sm">{{ option.label }}</Label>
        <Switch
          :id="fieldId(option.key)"
          :model-value="Boolean(props.values[option.key])"
          @update:model-value="value => handleUpdate(option.key, value)"
        />
      </div>
    </div>
  </div>
</template>
