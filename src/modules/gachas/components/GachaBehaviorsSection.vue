<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideTicket } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import type { CatalogGachaBehavior } from "@/modules/gachas/lib/gacha-catalog"
import {
  resolveGachaBehaviorTypeLabel,
  resolveGachaCostResourceLabel,
} from "@/modules/gachas/lib/gacha-labels"

defineProps<{
  behaviors: readonly CatalogGachaBehavior[]
  loading: boolean
}>()

const { t, te } = useI18n()
const ctx = { t, te }

function costLabel(behavior: CatalogGachaBehavior): string {
  if (!behavior.costResourceType) {
    return t("gachaCatalog.behaviors.free")
  }
  const resource = resolveGachaCostResourceLabel(ctx, behavior.costResourceType)
  return behavior.costResourceQuantity != null ? `${behavior.costResourceQuantity} ${resource}` : resource
}
</script>

<template>
  <CatalogDetailSection
    :title="t('gachas.detail.behaviors')"
    :icon="LucideTicket"
    collapsible
    :default-open="false"
    :loading="loading"
    :empty="behaviors.length === 0"
    :empty-message="t('gachaCatalog.behaviors.empty')"
  >
    <template #summary>{{ t("gachaCatalog.behaviors.summary", { count: behaviors.length }) }}</template>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b text-muted-foreground">
            <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.behaviorType") }}</th>
            <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.spinCount") }}</th>
            <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.cost") }}</th>
            <th class="py-1.5 font-medium">{{ t("gachas.detail.executeLimit") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(behavior, index) in behaviors"
            :key="behavior.id ?? `behavior-${index}`"
            class="border-b last:border-b-0"
          >
            <td class="py-1.5 pr-3">
              <span class="inline-flex flex-wrap items-center gap-1.5">
                {{ resolveGachaBehaviorTypeLabel(ctx, behavior.gachaBehaviorType) }}
                <Badge v-if="behavior.gachaSpinnableType === 'colorful_pass'" variant="fuchsia" size="sm">
                  {{ t("gachas.detail.colorfulPass") }}
                </Badge>
              </span>
            </td>
            <td class="py-1.5 pr-3 tabular-nums">{{ behavior.spinCount ?? "—" }}</td>
            <td class="py-1.5 pr-3 tabular-nums">{{ costLabel(behavior) }}</td>
            <td class="py-1.5 tabular-nums">{{ behavior.executeLimit ?? t("gachaCatalog.behaviors.unlimited") }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CatalogDetailSection>
</template>
