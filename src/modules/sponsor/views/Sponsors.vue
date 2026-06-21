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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSponsors } from "@/modules/sponsor/composables/useSponsors"
import type { SponsorSupporter } from "@/modules/sponsor/types"

const AFDIAN_URL = "https://ifdian.net/p/9c65d9cc617011ed81c352540025c377"

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

const summaryCards = computed(() => [
  {
    key: "supporters",
    label: t("sponsor.summary.supporters"),
    value: summary.value.supporterCount > 0
      ? String(summary.value.supporterCount)
      : t("sponsor.summary.pending"),
  },
])

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

function compareDurationSponsor(a: SponsorSupporter, b: SponsorSupporter) {
  const expiresDelta = timestampValue(b.planExpiresAt) - timestampValue(a.planExpiresAt)
  if (expiresDelta !== 0) {
    return expiresDelta
  }

  return compareSponsorTier(a, b)
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
      key: "duration",
      title: t("sponsor.sections.duration.title"),
      supporters: duration.sort(compareDurationSponsor),
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

function sponsorNote(sponsor: SponsorSupporter) {
  if (sponsor.message) {
    return sponsor.message
  }

  if (sponsor.isActive) {
    return t("sponsor.supporter.activeMessage")
  }

  return t("sponsor.supporter.defaultMessage")
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
      <section
        class="relative overflow-hidden rounded-xl border border-pink-500/15 bg-background shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
      >
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(236,72,153,0.14),transparent_48%,rgba(34,211,238,0.10))]" aria-hidden="true" />
        <div class="relative grid gap-8 px-5 py-8 md:grid-cols-[1.12fr_0.88fr] md:px-8 md:py-10">
          <div class="flex min-w-0 flex-col justify-between gap-8">
            <div class="space-y-4">
              <div class="inline-flex items-center gap-2 rounded-md border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-600 dark:text-pink-300">
                <Sparkles class="h-3.5 w-3.5" />
                {{ t("sponsor.hero.badge") }}
              </div>
              <div class="space-y-3">
                <h1 class="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  {{ t("sponsor.hero.title") }}
                </h1>
                <p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {{ t("sponsor.hero.description") }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button
                as-child
                class="h-11 bg-pink-600 px-5 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-pink-700 hover:shadow-md"
              >
                <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
                  <Heart class="h-4 w-4 fill-current" />
                  {{ t("sponsor.hero.cta") }}
                  <ExternalLink class="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                as-child
                class="h-11 border-pink-500/25 bg-white/60 px-5 font-semibold text-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-pink-500/45 hover:bg-white/80 dark:bg-slate-950/30 dark:hover:bg-slate-950/45"
              >
                <router-link to="/about">
                  <Info class="h-4 w-4" />
                  {{ t("sponsor.hero.aboutCta") }}
                </router-link>
              </Button>
            </div>
          </div>

          <div class="grid content-end gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div
              v-for="card in summaryCards"
              :key="card.key"
              class="rounded-lg border border-white/60 bg-white/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/38"
            >
              <p class="text-xs font-medium text-muted-foreground">{{ card.label }}</p>
              <p class="mt-1 text-xl font-bold tracking-tight text-foreground">{{ card.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
              <h2 class="truncate text-xl font-bold tracking-tight">{{ t("sponsor.list.title") }}</h2>
            </div>
            <span
              v-if="generatedAtLabel"
              class="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"
            >
              <CalendarDays class="h-3.5 w-3.5" />
              {{ generatedAtLabel }}
            </span>
          </div>

          <div v-if="loading" class="grid gap-3">
            <Skeleton v-for="index in 5" :key="index" class="h-20 rounded-lg" />
          </div>

          <div
            v-else-if="!hasSupporters"
            class="rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center"
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
              <div class="space-y-1">
                <h3 class="flex items-center gap-2 text-lg font-semibold text-foreground/85">
                  <span class="h-2 w-2 rounded-full bg-pink-500" />
                  {{ section.title }}
                </h3>
              </div>

              <div
                v-if="section.supporters.length === 0"
                class="rounded-xl border border-dashed bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground"
              >
                {{ t(`sponsor.sections.${section.key}.empty`) }}
              </div>

              <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  v-for="sponsor in section.supporters"
                  :key="sponsor.id"
                  class="h-full gap-2 border border-muted/50 bg-card/20 py-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/45 hover:shadow-md"
                >
                  <CardHeader class="flex flex-row items-center gap-3 pb-1">
                    <Avatar class="h-10 w-10 border border-muted/80 transition-colors duration-300">
                      <AvatarImage :src="sponsor.avatar" :alt="fallbackName(sponsor)" />
                      <AvatarFallback class="bg-pink-500/5 text-sm font-semibold text-pink-600 dark:text-pink-300">
                        {{ fallbackInitial(sponsor) }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate text-sm font-semibold">
                        {{ fallbackName(sponsor) }}
                      </CardTitle>
                      <span class="block truncate text-[10px] font-medium text-muted-foreground/80">
                        {{ sponsorSubtitle(sponsor) }}
                      </span>
                      <span class="mt-0.5 block truncate text-[10px] text-muted-foreground/70">
                        {{ sponsorStatusLabel(sponsor) }}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent class="pt-0">
                    <div
                      class="line-clamp-2 rounded-r border-l-2 border-pink-500/30 bg-pink-500/[0.02] py-0.5 pl-2 text-[10px] font-medium italic text-pink-600/80 dark:text-pink-300/80"
                    >
                      {{ sponsorNote(sponsor) }}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
