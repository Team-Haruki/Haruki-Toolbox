<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw, LucideTriangleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

withDefaults(defineProps<{
  message: string
  detail?: string | null
  retryLabel?: string | null
  retrying?: boolean
}>(), {
  detail: null,
  retryLabel: null,
  retrying: false,
})

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>

<template>
  <Card data-slot="catalog-error-state">
    <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
      <LucideTriangleAlert class="size-8 text-destructive/70" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ message }}</p>
      <p v-if="detail" class="max-w-full truncate font-mono text-xs text-muted-foreground" :title="detail">{{ detail }}</p>
      <Button variant="outline" size="sm" :disabled="retrying" @click="emit('retry')">
        <LucideRefreshCcw :class="['size-4', retrying ? 'animate-spin' : '']" />
        {{ retryLabel ?? t("catalog.results.retry") }}
      </Button>
    </CardContent>
  </Card>
</template>
