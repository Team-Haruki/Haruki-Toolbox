<script setup lang="ts">
import { useId } from "vue"
import { Search } from "lucide-vue-next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

defineProps<{
  label: string
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })
const inputId = useId()
</script>

<template>
  <div class="grid gap-2">
    <Label :for="inputId">{{ label }}</Label>
    <div class="relative w-full items-center">
      <Input
        :id="inputId"
        v-model="model"
        class="pl-10"
        type="text"
        :placeholder="placeholder"
      />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
        <Search class="size-4 text-muted-foreground" />
      </span>
    </div>
  </div>
</template>
