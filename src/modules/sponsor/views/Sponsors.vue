<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  CalendarDays,
  ExternalLink,
  Heart,
  Info,
  Sparkles,
  Users,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSponsors } from "@/modules/sponsor/composables/useSponsors"
import type { SponsorSupporter } from "@/modules/sponsor/types"

const AFDIAN_URL = "https://afdian.com/a/seiunx"

const { t, locale } = useI18n()
const { supporters, summary, loading, loadFailed } = useSponsors()

const hasSupporters = computed(() => supporters.value.length > 0)

const dateFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  dateStyle: "medium",
}))

const dateTimeFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  dateStyle: "medium",
  timeStyle: "medium",
}))

const heroStats = computed(() => {
  const stats: { key: string; label: string; value: string }[] = [
    {
      key: "supporters",
      label: t("sponsor.summary.supporters"),
      value: summary.value.supporterCount > 0
        ? String(summary.value.supporterCount)
        : t("sponsor.summary.pending"),
    },
  ]

  if (summary.value.supporterCount > 0) {
    const sectionCount = (key: SponsorSectionKey) =>
      sponsorSections.value.find((section) => section.key === key)?.supporters.length ?? 0
    stats.push({ key: "duration", label: t("sponsor.summary.duration"), value: String(sectionCount("duration")) })
    stats.push({ key: "oneTime", label: t("sponsor.summary.oneTime"), value: String(sectionCount("oneTime")) })
  }

  return stats
})

type SponsorSectionKey = "oneTime" | "duration" | "manual"
type SponsorSection = {
  key: SponsorSectionKey
  title: string
  supporters: SponsorSupporter[]
}

const nowMs = computed(() => Date.now())

function timestampValue(value: string) {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 0 : date.valueOf()
}

function utcOffsetLabel(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0")
  const minutes = String(absoluteMinutes % 60).padStart(2, "0")

  return `UTC${sign}${hours}:${minutes}`
}

const generatedAtLabel = computed(() => {
  if (!summary.value.generatedAt) {
    return ""
  }

  const date = new Date(summary.value.generatedAt)
  if (Number.isNaN(date.valueOf())) {
    return summary.value.generatedAt
  }

  return `${dateTimeFormatter.value.format(date)} (${utcOffsetLabel(date)})`
})

function isManualSponsor(sponsor: SponsorSupporter) {
  return ["manual", "legacy", "imported"].includes(sponsor.source.toLowerCase())
}

function hasCurrentDurationSponsor(sponsor: SponsorSupporter) {
  return sponsor.planName.trim() !== "" && sponsor.planExpiresAt !== ""
}

function isOneTimeSponsor(sponsor: SponsorSupporter) {
  const planName = sponsor.planName.trim()
  if (planName === "自选方案" || planName === "一次性赞助") {
    return true
  }

  return planName !== "" && sponsor.planPayMonths === null && sponsor.planExpiresAt !== ""
}

function isExpiredSponsor(sponsor: SponsorSupporter) {
  if (isOneTimeSponsor(sponsor)) {
    return false
  }

  const expiresAt = timestampValue(sponsor.planExpiresAt)
  return !hasCurrentDurationSponsor(sponsor) || (expiresAt > 0 && expiresAt < nowMs.value)
}

function compareSponsorTier(a: SponsorSupporter, b: SponsorSupporter) {
  const priceDelta = (b.planPrice ?? 0) - (a.planPrice ?? 0)
  if (priceDelta !== 0) {
    return priceDelta
  }

  const rankDelta = (b.planRank ?? 0) - (a.planRank ?? 0)
  if (rankDelta !== 0) {
    return rankDelta
  }

  const planDelta = sponsorSubtitle(a).localeCompare(sponsorSubtitle(b), locale.value)
  if (planDelta !== 0) {
    return planDelta
  }

  return timestampValue(b.paidAt) - timestampValue(a.paidAt)
}

const sponsorSections = computed<SponsorSection[]>(() => {
  const oneTime: SponsorSupporter[] = []
  const duration: SponsorSupporter[] = []
  const manual: SponsorSupporter[] = []

  for (const sponsor of supporters.value) {
    if (isOneTimeSponsor(sponsor)) {
      oneTime.push(sponsor)
    } else if (isManualSponsor(sponsor) || isExpiredSponsor(sponsor)) {
      manual.push(sponsor)
    } else {
      duration.push(sponsor)
    }
  }

  return [
    {
      // Backend already orders supporters by tier (plan rank) desc, then duration
      // (expiry) desc, so the duration list is rendered in server order as-is.
      key: "duration",
      title: t("sponsor.sections.duration.title"),
      supporters: duration,
    },
    {
      key: "oneTime",
      title: t("sponsor.sections.oneTime.title"),
      supporters: oneTime.sort(compareSponsorTier),
    },
    {
      key: "manual",
      title: t("sponsor.sections.manual.title"),
      supporters: manual.sort(compareSponsorTier),
    },
  ]
})

function fallbackName(sponsor: SponsorSupporter) {
  return sponsor.name || t("sponsor.supporter.anonymous")
}

function fallbackInitial(sponsor: SponsorSupporter) {
  return fallbackName(sponsor).charAt(0).toUpperCase()
}

function formatSponsorDate(sponsor: SponsorSupporter) {
  if (!sponsor.paidAt) {
    return t("sponsor.supporter.recent")
  }

  const date = new Date(sponsor.paidAt)
  if (Number.isNaN(date.valueOf())) {
    return t("sponsor.supporter.recent")
  }

  return dateFormatter.value.format(date)
}

function sponsorSubtitle(sponsor: SponsorSupporter) {
  return sponsor.planName || t("sponsor.supporter.pastPlan")
}

function sponsorStatusLabel(sponsor: SponsorSupporter) {
  if (isManualSponsor(sponsor)) {
    return t("sponsor.supporter.manual")
  }

  if (isOneTimeSponsor(sponsor)) {
    return t("sponsor.supporter.oneTime")
  }

  if (sponsor.planExpiresAt) {
    const date = formatSponsorDate({ ...sponsor, paidAt: sponsor.planExpiresAt })
    return timestampValue(sponsor.planExpiresAt) < nowMs.value
      ? t("sponsor.supporter.expiredAt", { date })
      : t("sponsor.supporter.activeUntil", { date })
  }

  return t("sponsor.supporter.expired")
}
</script>

<template>
  <div class="w-full flex-1 px-0 py-4">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <!-- Hero -->
      <section
        class="flex flex-col gap-4 border-b pb-8 pt-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 md:pt-4"
      >
        <p class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600 dark:text-pink-300">
          <span class="h-px w-8 bg-current opacity-60" aria-hidden="true" />
          <Sparkles class="h-3.5 w-3.5" />
          {{ t("sponsor.hero.badge") }}
        </p>
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {{ t("sponsor.hero.title") }}
        </h1>
        <p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {{ t("sponsor.hero.description") }}
        </p>

        <div class="mt-1 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="flex flex-wrap gap-3">
            <Button
              as-child
              class="h-11 bg-pink-600 px-5 font-semibold text-white transition-colors hover:bg-pink-700"
            >
              <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
                <Heart class="h-4 w-4 fill-current" />
                {{ t("sponsor.hero.cta") }}
                <ExternalLink class="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" as-child class="h-11 px-5 font-semibold">
              <router-link to="/about">
                <Info class="h-4 w-4" />
                {{ t("sponsor.hero.aboutCta") }}
              </router-link>
            </Button>
          </div>

          <!-- Numeric strip -->
          <dl class="flex items-stretch gap-6 sm:gap-8">
            <div
              v-for="(card, index) in heroStats"
              :key="card.key"
              :class="['min-w-0', index > 0 ? 'border-l pl-6 sm:pl-8' : '']"
            >
              <dt class="text-xs font-medium text-muted-foreground">{{ card.label }}</dt>
              <dd class="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{{ card.value }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Supporters -->
      <section class="space-y-5">
        <header class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 class="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight">
            <Users class="h-5 w-5 text-primary" />
            {{ t("sponsor.list.title") }}
          </h2>
          <span
            v-if="generatedAtLabel"
            class="inline-flex items-center gap-1 text-xs text-muted-foreground"
          >
            <CalendarDays class="h-3.5 w-3.5" />
            {{ generatedAtLabel }}
          </span>
        </header>

        <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton v-for="index in 6" :key="index" class="h-24 rounded-xl" />
        </div>

        <div
          v-else-if="!hasSupporters"
          class="rounded-xl border border-dashed bg-muted/20 px-5 py-12 text-center"
        >
          <Heart class="mx-auto h-9 w-9 text-muted-foreground/60" />
          <h3 class="mt-4 text-base font-semibold">
            {{ loadFailed ? t("sponsor.empty.unavailableTitle") : t("sponsor.empty.title") }}
          </h3>
          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {{ loadFailed ? t("sponsor.empty.unavailableDescription") : t("sponsor.empty.description") }}
          </p>
        </div>

        <div v-else class="space-y-8">
          <div
            v-for="section in sponsorSections"
            :key="section.key"
            class="space-y-3"
          >
            <h3 class="flex items-baseline gap-2 text-base font-semibold">
              {{ section.title }}
              <span class="text-sm font-normal tabular-nums text-muted-foreground">{{ section.supporters.length }}</span>
            </h3>

            <div
              v-if="section.supporters.length === 0"
              class="rounded-xl border border-dashed bg-muted/20 px-5 py-6 text-center text-sm text-muted-foreground"
            >
              {{ t(`sponsor.sections.${section.key}.empty`) }}
            </div>

            <!-- Past / manual supporters: quiet chip wall -->
            <div v-else-if="section.key === 'manual'" class="flex flex-wrap gap-2">
              <span
                v-for="sponsor in section.supporters"
                :key="sponsor.id"
                class="inline-flex max-w-full items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3"
                :title="`${sponsorSubtitle(sponsor)} · ${sponsorStatusLabel(sponsor)}`"
              >
                <Avatar class="h-6 w-6 border">
                  <AvatarImage :src="sponsor.avatar" :alt="fallbackName(sponsor)" loading="lazy" decoding="async" />
                  <AvatarFallback class="bg-muted text-[10px] font-semibold">
                    {{ fallbackInitial(sponsor) }}
                  </AvatarFallback>
                </Avatar>
                <span class="truncate text-xs font-medium">{{ fallbackName(sponsor) }}</span>
              </span>
            </div>

            <!-- Active / one-time supporters: cards -->
            <div
              v-else
              :class="[
                'grid grid-cols-1 gap-3',
                section.key === 'duration' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4',
              ]"
            >
              <article
                v-for="sponsor in section.supporters"
                :key="sponsor.id"
                class="flex h-full flex-col gap-2.5 rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-500/45 hover:shadow-md"
              >
                <div class="flex items-center gap-3">
                  <Avatar :class="section.key === 'duration' ? 'h-11 w-11 border' : 'h-9 w-9 border'">
                    <AvatarImage :src="sponsor.avatar" :alt="fallbackName(sponsor)" loading="lazy" decoding="async" />
                    <AvatarFallback class="bg-pink-500/5 text-sm font-semibold text-pink-600 dark:text-pink-300">
                      {{ fallbackInitial(sponsor) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">{{ fallbackName(sponsor) }}</p>
                    <p class="truncate text-xs font-medium text-pink-600/90 dark:text-pink-300/90">
                      {{ sponsorSubtitle(sponsor) }}
                    </p>
                  </div>
                </div>
                <p
                  v-if="sponsorStatusLabel(sponsor) !== sponsorSubtitle(sponsor)"
                  class="truncate text-xs text-muted-foreground"
                >
                  {{ sponsorStatusLabel(sponsor) }}
                </p>
                <p
                  v-if="sponsor.message"
                  class="line-clamp-2 rounded-r border-l-2 border-pink-500/30 bg-pink-500/[0.03] py-0.5 pl-2 text-xs font-medium italic text-pink-600/80 dark:text-pink-300/80"
                >
                  {{ sponsor.message }}
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
