<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ExternalLink, Heart } from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import { useSponsors } from "@/modules/sponsor/composables/useSponsors"
import { groupSponsorsByCategory, groupSponsorsByPlan, sponsorStatus } from "@/modules/sponsor/lib/categories"
import type { SponsorSupporter } from "@/modules/sponsor/types"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"

const AFDIAN_URL = "https://afdian.com/a/seiunx"

const { t } = useI18n()
const { supporters, summary, loading, loadFailed, retry } = useSponsors()

// The backend decides each supporter's category and already orders them by
// tier, then by expiry, so every list renders in server order.
const groups = computed(() => groupSponsorsByCategory(supporters.value))
const currentPlans = computed(() => groupSponsorsByPlan(groups.value.current))

const stats = computed(() => [
  { key: "supporters", label: t("sponsor.summary.supporters"), value: summary.value.supporterCount },
  { key: "current", label: t("sponsor.summary.current"), value: groups.value.current.length },
  { key: "former", label: t("sponsor.summary.former"), value: groups.value.former.length },
])

const generatedAtLabel = computed(() =>
  summary.value.generatedAt
    ? formatLocalizedDateTime(summary.value.generatedAt, "dateTime", summary.value.generatedAt)
    : "",
)

function displayName(sponsor: SponsorSupporter) {
  return sponsor.name || t("sponsor.supporter.anonymous")
}

function initial(sponsor: SponsorSupporter) {
  return displayName(sponsor).charAt(0).toUpperCase()
}

function statusLabel(sponsor: SponsorSupporter) {
  const status = sponsorStatus(sponsor)
  if ("date" in status) {
    return t(`sponsor.supporter.${status.key}`, {
      date: formatLocalizedDate(status.date, "date", t("sponsor.supporter.recent")),
    })
  }
  return t(`sponsor.supporter.${status.key}`)
}

/** "Sponsored until 2027/02/02 · 3 times": the second part only once there is a second time. */
function supporterMeta(sponsor: SponsorSupporter) {
  const parts = [statusLabel(sponsor)]
  if (sponsor.supportCount != null && sponsor.supportCount > 1) {
    parts.push(t("sponsor.supporter.supportCount", { count: sponsor.supportCount }))
  }
  return parts.join(" · ")
}

function formerTitle(sponsor: SponsorSupporter) {
  return [sponsor.planName, statusLabel(sponsor)].filter(Boolean).join(" · ")
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-6xl gap-4">
      <!-- The app page header (not the editorial one of /about, /privacy, /tos). -->
      <PageHeader :eyebrow="t('sponsor.hero.badge')" :title="t('sponsor.hero.title')" :description="t('sponsor.hero.description')">
        <template #actions>
          <Button variant="outline" as-child>
            <RouterLink to="/about">{{ t("sponsor.hero.aboutCta") }}</RouterLink>
          </Button>
          <Button as-child variant="brand" class="font-semibold">
            <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
              <Heart class="size-4 fill-current" />
              {{ t("sponsor.hero.cta") }}
              <ExternalLink class="size-4" />
            </a>
          </Button>
        </template>
      </PageHeader>

      <div v-if="loading" class="grid gap-4" aria-busy="true">
        <Skeleton class="h-20 rounded-xl" />
        <Skeleton class="h-64 rounded-xl" />
      </div>

      <div v-else-if="loadFailed" class="rounded-xl border bg-card px-4">
        <LoadErrorState
          :title="t('sponsor.empty.unavailableTitle')"
          :description="t('sponsor.empty.unavailableDescription')"
          @retry="retry"
        />
      </div>

      <div v-else-if="supporters.length === 0" class="rounded-xl border bg-card px-4">
        <EmptyState :icon="Heart" :title="t('sponsor.empty.title')" />
      </div>

      <template v-else>
        <!-- How many, and as of when -->
        <section class="@container rounded-xl border bg-card" data-testid="sponsor-summary">
          <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 py-3">
            <dl class="flex flex-wrap gap-x-8 gap-y-2">
              <div v-for="stat in stats" :key="stat.key" class="flex flex-col" :data-stat="stat.key">
                <dt class="text-[11px] text-muted-foreground">{{ stat.label }}</dt>
                <dd class="text-2xl leading-tight font-semibold tabular-nums">{{ stat.value }}</dd>
              </div>
            </dl>
            <p v-if="generatedAtLabel" class="text-xs tabular-nums text-muted-foreground">
              {{ t("sponsor.summary.updatedAt", { time: generatedAtLabel }) }}
            </p>
          </div>
        </section>

        <!-- Current supporters, plan by plan -->
        <section class="grid gap-2" data-testid="sponsor-section-current">
          <h2 class="flex items-baseline gap-2 px-1 text-sm font-semibold">
            {{ t("sponsor.sections.current.title") }}
            <span class="text-xs font-normal tabular-nums text-muted-foreground">{{ groups.current.length }}</span>
          </h2>

          <p v-if="groups.current.length === 0" class="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {{ t("sponsor.sections.current.empty") }}
          </p>

          <section
            v-for="(plan, index) in currentPlans"
            :key="index"
            class="@container overflow-hidden rounded-xl border bg-card"
            data-testid="sponsor-plan"
          >
            <header class="flex items-baseline justify-between gap-3 border-b border-border/60 px-4 py-2.5">
              <h3 class="min-w-0 truncate text-sm font-semibold">{{ plan.planName || t("sponsor.supporter.defaultPlan") }}</h3>
              <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                {{ t("sponsor.sections.planCount", { count: plan.supporters.length }) }}
              </span>
            </header>
            <!-- Each cell draws its own right and bottom hairline; the negative margin tucks the outer ones under the panel edge. -->
            <ul class="-mr-px -mb-px grid grid-cols-1 @min-[36rem]:grid-cols-2 @min-[58rem]:grid-cols-3">
              <li
                v-for="sponsor in plan.supporters"
                :key="sponsor.id"
                class="flex min-w-0 items-start gap-3 border-r border-b border-border/60 px-4 py-3"
              >
                <Avatar class="size-10 shrink-0 border">
                  <AvatarImage :src="sponsor.avatar" :alt="displayName(sponsor)" loading="lazy" decoding="async" />
                  <AvatarFallback class="bg-muted text-sm font-semibold">{{ initial(sponsor) }}</AvatarFallback>
                </Avatar>
                <div class="flex min-w-0 flex-1 flex-col">
                  <p class="truncate text-sm font-medium">{{ displayName(sponsor) }}</p>
                  <p class="truncate text-xs tabular-nums text-muted-foreground">{{ supporterMeta(sponsor) }}</p>
                  <p v-if="sponsor.message" class="mt-1 line-clamp-3 text-xs text-foreground/80 [overflow-wrap:anywhere]">
                    “{{ sponsor.message }}”
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </section>

        <!-- Former supporters: named, without the detail -->
        <section class="grid gap-2" data-testid="sponsor-section-former">
          <h2 class="flex items-baseline gap-2 px-1 text-sm font-semibold">
            {{ t("sponsor.sections.former.title") }}
            <span class="text-xs font-normal tabular-nums text-muted-foreground">{{ groups.former.length }}</span>
          </h2>
          <p v-if="groups.former.length === 0" class="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            {{ t("sponsor.sections.former.empty") }}
          </p>
          <ul v-else class="flex flex-wrap gap-x-5 gap-y-2.5 rounded-xl border bg-card px-4 py-3">
            <li
              v-for="sponsor in groups.former"
              :key="sponsor.id"
              class="flex max-w-full min-w-0 items-center gap-1.5"
              :title="formerTitle(sponsor)"
            >
              <Avatar class="size-5 shrink-0 border">
                <AvatarImage :src="sponsor.avatar" :alt="displayName(sponsor)" loading="lazy" decoding="async" />
                <AvatarFallback class="bg-muted text-[10px] font-semibold">{{ initial(sponsor) }}</AvatarFallback>
              </Avatar>
              <span class="truncate text-xs">{{ displayName(sponsor) }}</span>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>
