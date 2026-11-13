<script setup lang="ts">
/**
 * "Who you are signed in as", with the way to switch account when the page
 * has one (`switchable`). A child of the panel's `<dl>`.
 */
import { useI18n } from "vue-i18n"
import { Loader2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

withDefaults(defineProps<{
  name: string
  switchable?: boolean
  switching?: boolean
  disabled?: boolean
  /** Test id of the element that holds exactly the name. */
  nameTestid?: string
}>(), {
  switchable: false,
  switching: false,
  disabled: false,
  nameTestid: undefined,
})

const emit = defineEmits<{ switch: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="min-w-0 px-4 py-3" data-slot="oauth-account-row">
    <dt class="text-[11px] text-muted-foreground">{{ t("oauth.common.account") }}</dt>
    <dd class="mt-0.5 min-w-0">
      <div class="flex min-w-0 items-center justify-between gap-3">
        <span class="min-w-0 text-sm font-medium [overflow-wrap:anywhere]" :data-testid="nameTestid">{{ name }}</span>
        <Button
          v-if="switchable"
          type="button"
          variant="outline"
          size="sm"
          class="-my-1 h-7 shrink-0 gap-1 px-2 text-xs"
          :disabled="disabled || switching"
          @click="emit('switch')"
        >
          <Loader2 v-if="switching" class="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ t("oauth.common.switchAccount") }}
        </Button>
      </div>
    </dd>
  </div>
</template>
