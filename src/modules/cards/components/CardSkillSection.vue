<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideSparkles } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import { buildCardSkillView, formatCardSkillAtLevel, type CardSkillRecord } from "@/modules/cards/lib/card-skill"

type SkillVariant = "base" | "trained"

/**
 * Skill description driven by a level slider; Bloom Fes cards get
 * before / after training tabs. The per-level effect table highlights the
 * selected level.
 */
const props = defineProps<{
  skill: CardSkillRecord | null
  trainedSkill: CardSkillRecord | null
  skillName: string | null
  trainedSkillName: string | null
  characterName: string | null
  loading: boolean
}>()

const { t, te } = useI18n()
const id = useId()

const variant = ref<SkillVariant>("base")
const level = ref(4)

const record = computed(() => (variant.value === "trained" && props.trainedSkill ? props.trainedSkill : props.skill))
const maxLevel = computed(() => Math.max(1, record.value?.maxLevel ?? 4))

watch(maxLevel, (max) => {
  if (level.value > max) {
    level.value = max
  }
}, { immediate: true })

watch(() => props.skill?.id, () => {
  variant.value = "base"
})

const activeName = computed(() => (variant.value === "trained" ? props.trainedSkillName : props.skillName))

const description = computed(() => (record.value
  ? formatCardSkillAtLevel(record.value, level.value, { characterName: props.characterName ?? undefined })
  : ""))

const rows = computed(() => (record.value ? buildCardSkillView(record.value).effectRows : []))

const typeLabels = computed(() => (record.value?.effectTypes ?? [])
  .map((type) => resolveSekaiEnumLabel({ t, te }, "cardCatalog.skillTypes", type)))

function handleLevel(value: number[] | undefined) {
  const next = value?.[0]
  if (typeof next === "number" && Number.isFinite(next)) {
    level.value = Math.min(Math.max(1, Math.round(next)), maxLevel.value)
  }
}

function handleVariant(value: string | number) {
  if (value === "base" || value === "trained") {
    variant.value = value
  }
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.skill.title')"
    :icon="LucideSparkles"
    :loading="loading && !skill"
    :empty="!loading && !skill"
    :empty-message="t('cardCatalog.detail.skill.empty')"
    content-class="flex flex-col gap-4"
  >
    <template #action>
      <Tabs v-if="trainedSkill" :model-value="variant" @update:model-value="handleVariant">
        <TabsList class="h-8">
          <TabsTrigger value="base" class="text-xs">{{ t("cardCatalog.detail.skill.beforeTraining") }}</TabsTrigger>
          <TabsTrigger value="trained" class="text-xs">{{ t("cardCatalog.detail.skill.afterTraining") }}</TabsTrigger>
        </TabsList>
      </Tabs>
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <p v-if="activeName" class="text-sm font-semibold">{{ activeName }}</p>
      <Badge v-for="label in typeLabels" :key="label" variant="muted" size="sm">{{ label }}</Badge>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between text-sm">
        <Label :for="`${id}-level`">{{ t("cardCatalog.detail.skill.level") }}</Label>
        <span class="tabular-nums text-muted-foreground">Lv. {{ level }} / {{ maxLevel }}</span>
      </div>
      <Slider
        :id="`${id}-level`"
        :model-value="[level]"
        :min="1"
        :max="maxLevel"
        :step="1"
        :aria-label="t('cardCatalog.detail.skill.level')"
        @update:model-value="handleLevel"
      />
    </div>

    <p class="text-sm leading-relaxed whitespace-pre-line">{{ description }}</p>

    <div v-if="rows.length > 0" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b text-muted-foreground">
            <th class="py-1.5 pr-3 font-medium">{{ t("cardCatalog.detail.skill.level") }}</th>
            <th class="py-1.5 pr-3 font-medium">{{ t("cardCatalog.detail.skill.value") }}</th>
            <th class="py-1.5 font-medium">{{ t("cardCatalog.detail.skill.duration") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.level"
            :class="['border-b last:border-b-0', row.level === level ? 'bg-primary/5 font-medium' : '']"
          >
            <td class="py-1.5 pr-3 tabular-nums">Lv. {{ row.level }}</td>
            <td class="py-1.5 pr-3 tabular-nums">{{ row.value ?? "—" }}</td>
            <td class="py-1.5 tabular-nums">{{ row.duration != null ? `${row.duration}s` : "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CatalogDetailSection>
</template>
