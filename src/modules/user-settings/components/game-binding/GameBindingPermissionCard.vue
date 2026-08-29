<script setup lang="ts">
import { useId } from "vue"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Props {
  modelValue?: boolean
  title: string
  description: string
}

const props = defineProps<Props>()
const switchId = useId()
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
}>()

function handleValueUpdate(value: boolean) {
  emit("update:modelValue", value)
}
</script>

<template>
  <Card class="flex justify-center p-3">
    <div class="flex items-center gap-3">
      <Switch
        :id="switchId"
        :model-value="Boolean(props.modelValue)"
        @update:model-value="handleValueUpdate"
      />
      <div class="flex-1">
        <Label :for="switchId" class="font-semibold">{{ props.title }}</Label>
        <p class="text-sm text-muted-foreground">
          {{ props.description }}
        </p>
      </div>
    </div>
  </Card>
</template>
