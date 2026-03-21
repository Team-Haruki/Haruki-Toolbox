<script setup lang="ts">
import { ref, computed } from "vue"
import { CalendarIcon } from "lucide-vue-next"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { type DateValue, CalendarDate } from "@internationalized/date"

const props = defineProps<{
  modelValue?: Date
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val?: Date): void
}>()

const isOpen = ref(false)
const hours = Array.from({ length: 24 }, (_, i) => i)

const calendarDate = computed({
  get: () => {
    if (!props.modelValue) return undefined
    return new CalendarDate(
      props.modelValue.getFullYear(),
      props.modelValue.getMonth() + 1,
      props.modelValue.getDate()
    )
  },
  set: (val: DateValue | undefined) => {
    if (!val) {
      emit('update:modelValue', undefined)
      return
    }
    const newDate = props.modelValue ? new Date(props.modelValue) : new Date(new Date().setHours(0, 0, 0, 0))
    newDate.setFullYear(val.year, val.month - 1, val.day)
    emit('update:modelValue', newDate)
  }
})

const handleTimeChange = (type: "hour" | "minute", value: string) => {
  const newDate = props.modelValue ? new Date(props.modelValue) : new Date(new Date().setHours(0, 0, 0, 0))
  if (type === "hour") {
    newDate.setHours(parseInt(value))
  } else if (type === "minute") {
    newDate.setMinutes(parseInt(value))
  }
  emit('update:modelValue', newDate)
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-muted-foreground'
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span v-if="modelValue">{{ format(modelValue, "yyyy/MM/dd HH:mm") }}</span>
        <span v-else>{{ placeholder || "请选择时间" }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <div class="sm:flex">
        <Calendar
          v-model="calendarDate"
          initial-focus
        />
        <div class="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0 sm:border-l">
          <ScrollArea class="w-64 sm:w-auto">
            <div class="flex sm:flex-col p-2">
              <Button
                v-for="hour in hours"
                :key="hour"
                size="icon"
                :variant="modelValue && modelValue.getHours() === hour ? 'default' : 'ghost'"
                class="sm:w-full shrink-0 aspect-square"
                @click="handleTimeChange('hour', hour.toString())"
              >
                {{ hour.toString().padStart(2, '0') }}
              </Button>
            </div>
            <ScrollBar orientation="horizontal" class="sm:hidden" />
          </ScrollArea>
          <ScrollArea class="w-64 sm:w-auto">
            <div class="flex sm:flex-col p-2">
              <Button
                v-for="minute in Array.from({ length: 12 }, (_, i) => i * 5)"
                :key="minute"
                size="icon"
                :variant="modelValue && modelValue.getMinutes() === minute ? 'default' : 'ghost'"
                class="sm:w-full shrink-0 aspect-square"
                @click="handleTimeChange('minute', minute.toString())"
              >
                {{ minute.toString().padStart(2, '0') }}
              </Button>
            </div>
            <ScrollBar orientation="horizontal" class="sm:hidden" />
          </ScrollArea>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
