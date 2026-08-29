<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useI18n } from "vue-i18n"
import { CalendarIcon } from "lucide-vue-next"
// Local zero-dep replacement for date-fns `format(date, "yyyy/MM/dd HH:mm")`.
function formatDateTime(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${value.getFullYear()}/${pad(value.getMonth() + 1)}/${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`
}

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { type DateValue, CalendarDate } from "@internationalized/date"

const props = defineProps<{
  id?: string
  modelValue?: Date
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val?: Date): void
}>()

const { locale } = useI18n()
const isOpen = ref(false)
const hours = Array.from({ length: 24 }, (_, i) => i)

function placeholderFromModel(): CalendarDate {
  const date = props.modelValue ?? new Date()
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// Controlled placeholder so reopening the popover lands on the selected
// month/year (the Calendar unmounts on close and would otherwise reset to today).
const calendarPlaceholder = ref<DateValue>(placeholderFromModel())

// The game launched in 2020 — keep the year dropdown to a sensible window
// instead of the Calendar default (-100..+10 years). The navigated
// (placeholder) year must stay listed even when prev/next walks outside it.
const YEAR_RANGE_START = 2020
const calendarYearRange = computed<DateValue[]>(() => {
  const modelYear = props.modelValue ? props.modelValue.getFullYear() : YEAR_RANGE_START
  const endYear = Math.max(new Date().getFullYear() + 1, modelYear, calendarPlaceholder.value.year)
  const startYear = Math.min(YEAR_RANGE_START, modelYear, calendarPlaceholder.value.year)
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => new CalendarDate(startYear + i, 1, 1),
  )
})

watch(isOpen, (open) => {
  if (open) calendarPlaceholder.value = placeholderFromModel()
})

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
    newDate.setHours(Number.parseInt(value, 10))
  } else if (type === "minute") {
    newDate.setMinutes(Number.parseInt(value, 10))
  }
  emit('update:modelValue', newDate)
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger asChild>
      <Button
        :id="props.id"
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-muted-foreground'
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        <span v-if="modelValue">{{ formatDateTime(modelValue) }}</span>
        <span v-else>{{ placeholder || "请选择时间" }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <div class="sm:flex">
        <Calendar
          v-model="calendarDate"
          v-model:placeholder="calendarPlaceholder"
          layout="month-and-year"
          :year-range="calendarYearRange"
          :locale="locale"
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
