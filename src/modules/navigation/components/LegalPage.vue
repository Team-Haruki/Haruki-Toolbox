<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { CalendarClock, ChevronDown, List, Mail } from "lucide-vue-next"

export interface LegalSectionDef {
  readonly key: string
  readonly paragraphKeys: readonly string[]
  readonly bulletKeys: readonly string[]
}

const props = defineProps<{
  /** i18n namespace prefix, e.g. "legal.privacy" */
  ns: string
  icon: Component
  sections: readonly LegalSectionDef[]
}>()

const { t } = useI18n()

const contactEmail = "haruki@seiunx.com"
const contactHref = `mailto:${contactEmail}`

interface RenderedSection {
  key: string
  anchorId: string
  number: string
  heading: string
  paragraphs: string[]
  bullets: string[]
}

// Locale section titles carry their own "1. " prefix; split it off so the
// number can be styled as a marker without being repeated in the heading.
// If a title ever stops matching, it falls back to rendering unchanged.
const renderedSections = computed<RenderedSection[]>(() =>
  props.sections.map((section, index) => {
    const base = `${props.ns}.sections.${section.key}`
    const rawTitle = t(`${base}.title`)
    const match = rawTitle.match(/^(\d+)[.、]\s*(.+)$/)
    return {
      key: section.key,
      anchorId: `section-${section.key}`,
      number: (match ? match[1] : String(index + 1)).padStart(2, "0"),
      heading: match ? match[2] : rawTitle,
      paragraphs: section.paragraphKeys.map((paragraphKey) =>
        t(`${base}.paragraphs.${paragraphKey}`),
      ),
      bullets: section.bulletKeys.map((bulletKey) => t(`${base}.bullets.${bulletKey}`)),
    }
  }),
)
</script>

<template>
  <div class="w-full flex-1 px-4 py-6 max-w-5xl mx-auto flex flex-col gap-8">
    <!-- Header -->
    <header class="flex flex-col gap-3 border-b pb-8 pt-2 md:pt-4">
      <p class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <span class="h-px w-8 bg-current opacity-60" aria-hidden="true" />
        <component :is="icon" class="h-3.5 w-3.5" />
        {{ t("legal.common.eyebrow") }}
      </p>
      <h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">
        {{ t(`${ns}.title`) }}
      </h1>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
        {{ t(`${ns}.intro`) }}
      </p>
      <div class="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1.5">
          <CalendarClock class="h-3.5 w-3.5" />
          {{ t(`${ns}.lastUpdated`) }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Mail class="h-3.5 w-3.5" />
          <span>
            {{ t(`${ns}.contactLead`) }}
            <a
              :href="contactHref"
              class="font-medium text-primary underline-offset-4 hover:underline"
            >
              {{ contactEmail }}
            </a>
          </span>
        </span>
      </div>
    </header>

    <!-- Mobile TOC -->
    <details class="group rounded-xl border bg-card lg:hidden">
      <summary
        class="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"
      >
        <List class="h-4 w-4 text-primary" />
        {{ t("legal.common.toc") }}
        <ChevronDown
          class="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <nav class="border-t px-2 py-2">
        <a
          v-for="section in renderedSections"
          :key="section.key"
          :href="`#${section.anchorId}`"
          class="flex items-baseline gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <span class="text-xs font-semibold tabular-nums text-primary/60">
            {{ section.number }}
          </span>
          {{ section.heading }}
        </a>
      </nav>
    </details>

    <div class="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <!-- Desktop TOC -->
      <nav
        class="hidden lg:sticky lg:top-24 lg:block"
        :aria-label="t('legal.common.toc')"
      >
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
        >
          {{ t("legal.common.toc") }}
        </p>
        <ul class="space-y-0.5 border-l border-border/60">
          <li v-for="section in renderedSections" :key="section.key">
            <a
              :href="`#${section.anchorId}`"
              class="-ml-px flex items-baseline gap-2 border-l border-transparent py-1 pl-3.5 pr-2 text-[13px] leading-snug text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              <span class="text-[11px] font-semibold tabular-nums text-primary/50">
                {{ section.number }}
              </span>
              {{ section.heading }}
            </a>
          </li>
        </ul>
      </nav>

      <!-- Content -->
      <div class="mt-2 max-w-3xl space-y-12 lg:mt-0">
        <section
          v-for="section in renderedSections"
          :id="section.anchorId"
          :key="section.key"
          class="scroll-mt-24"
        >
          <div class="flex items-baseline gap-3">
            <span class="text-sm font-bold tabular-nums text-primary/70" aria-hidden="true">
              {{ section.number }}
            </span>
            <h2 class="text-lg font-semibold tracking-tight md:text-xl">
              {{ section.heading }}
            </h2>
          </div>
          <div
            class="mt-3 space-y-3 border-l-2 border-border/60 pl-4 text-sm leading-7 text-muted-foreground md:pl-5"
          >
            <p v-for="(paragraph, index) in section.paragraphs" :key="index">
              {{ paragraph }}
            </p>
            <ul
              v-if="section.bullets.length > 0"
              class="list-disc space-y-1.5 pl-5 marker:text-primary/40"
            >
              <li v-for="(bullet, index) in section.bullets" :key="index">
                {{ bullet }}
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
