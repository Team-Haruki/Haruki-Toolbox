<script setup lang="ts">
import { computed, ref, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowDown,
  BookOpenText,
  CodeXml,
  Crown,
  ExternalLink,
  Github,
  Handshake,
  Heart,
  Sparkles,
  Users,
} from "lucide-vue-next"
import {
  CONTRIBUTOR_IDENTITIES,
  CONTRIBUTORS,
  PROJECT_GROUPS,
  countContributorsByIdentity,
  filterContributors,
  orderedIdentities,
  projectLanguage,
  resolveContributorAvatarUrl,
  sortContributors,
  type AboutProject,
  type Contributor,
  type ContributorIdentity,
  type ProjectTeam,
} from "../lib/about-data"

const HARUKI_LOGO = `${import.meta.env.BASE_URL}assets/haruki.ico`
const GITHUB_ORG_URL = "https://github.com/Team-Haruki"
const AFDIAN_URL = "https://afdian.com/a/seiunx"
const TEAM_NAMES: Record<ProjectTeam, string> = { haruki: "Haruki Dev Team", seiunx: "Seiunx Dev Team" }

const { t, te } = useI18n()
const settingsStore = useSettingsStore()

// Each identity is a tag: an icon and a tone, so it never reads by color alone.
const IDENTITY_STYLE: Record<ContributorIdentity, { icon: Component; variant: BadgeVariants["variant"] }> = {
  founder: { icon: Sparkles, variant: "amber" },
  core: { icon: CodeXml, variant: "default" },
  docs: { icon: BookOpenText, variant: "violet" },
  collab: { icon: Handshake, variant: "sky" },
  sponsor: { icon: Crown, variant: "rose" },
}

const contributors = sortContributors(CONTRIBUTORS)
const identityCounts = countContributorsByIdentity(contributors)
const identityFilters = CONTRIBUTOR_IDENTITIES.filter((identity) => identityCounts[identity] > 0)

const activeIdentity = ref<ContributorIdentity | null>(null)
const visibleContributors = computed(() => filterContributors(contributors, activeIdentity.value))
const contributorsHint = computed(() =>
  activeIdentity.value
    ? t(`navigationPages.about.contributors.identities.${activeIdentity.value}.desc`)
    : t("navigationPages.about.contributors.subtitle")
)

function toggleIdentity(identity: ContributorIdentity) {
  activeIdentity.value = activeIdentity.value === identity ? null : identity
}

function contributorName(contributor: Contributor): string {
  return t(`navigationPages.about.contributors.members.${contributor.key}.name`)
}

// Only some contributors left a line; the locale fallback chain covers the rest.
function contributorQuote(contributor: Contributor): string {
  const quoteKey = `navigationPages.about.contributors.members.${contributor.key}.quote`
  return te(quoteKey) ? t(quoteKey) : ""
}

// The GitHub handle, unless it only repeats the display name.
function contributorHandle(contributor: Contributor): string {
  const handle = contributor.github ?? ""
  return handle.toLowerCase() === contributorName(contributor).toLowerCase() ? "" : handle
}

function contributorAvatar(contributor: Contributor): string {
  return resolveContributorAvatarUrl(contributor, settingsStore.currentEndpoint)
}

// One dot color per main language keeps the project rows quiet.
const LANGUAGE_DOT: Record<string, string> = {
  "typescript": "bg-emerald-500",
  "go": "bg-sky-500",
  "rust": "bg-amber-500",
  "c++": "bg-rose-500",
  "python": "bg-yellow-500",
}

function languageDotClass(project: AboutProject): string {
  return LANGUAGE_DOT[projectLanguage(project)] ?? "bg-muted-foreground"
}

function showTeamProjects(team: ProjectTeam) {
  const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  document.getElementById(`about-projects-${team}`)?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-6" data-testid="about-page">
    <!-- Who we are -->
    <section class="flex flex-col gap-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <img
            :src="HARUKI_LOGO"
            alt=""
            class="size-14 shrink-0 rounded-2xl border bg-card object-cover"
            decoding="async"
          >
          <div class="min-w-0">
            <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
              {{ t("navigationPages.about.title") }}
            </h1>
            <p class="mt-0.5 text-sm text-muted-foreground">
              {{ t("navigationPages.about.subtitle") }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <Button as-child variant="outline">
            <a :href="GITHUB_ORG_URL" target="_blank" rel="noopener noreferrer">
              <Github class="size-4" />
              Team-Haruki
              <ExternalLink class="size-3.5 text-muted-foreground" />
            </a>
          </Button>
          <Button as-child variant="brand">
            <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
              <Heart class="size-4 fill-current" />
              {{ t("navigationPages.about.support.afdianBtn") }}
            </a>
          </Button>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div class="max-w-2xl space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p class="text-base leading-relaxed text-foreground">
            {{ t("navigationPages.about.projectIntro.p1Before") }}<span class="font-semibold">{{ t("navigationPages.about.projectIntro.p1Name") }}</span>{{ t("navigationPages.about.projectIntro.p1After") }}
          </p>
          <p>{{ t("navigationPages.about.projectIntro.p2") }}</p>
          <p>{{ t("navigationPages.about.projectIntro.p3") }}</p>
        </div>

        <!-- The network and its two teams, as a tree -->
        <aside class="self-start rounded-2xl border bg-card p-5" aria-labelledby="about-structure-title">
          <h2 id="about-structure-title" class="text-xs font-semibold text-muted-foreground">
            {{ t("navigationPages.about.structure.title") }}
          </h2>
          <p class="mt-3 text-sm font-semibold">
            {{ t("navigationPages.about.projectIntro.p1Name") }}
          </p>
          <ul class="ml-1.5 mt-1 border-l border-border pl-0">
            <li
              v-for="group in PROJECT_GROUPS"
              :key="group.key"
              class="relative pl-5 pt-3 before:absolute before:left-0 before:top-[1.45rem] before:w-3.5 before:border-t before:border-border last:border-l last:border-card last:-ml-px"
            >
              <button
                type="button"
                class="group -m-1.5 block w-[calc(100%+0.75rem)] rounded-lg p-1.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                :data-testid="`about-structure-${group.key}`"
                @click="showTeamProjects(group.key)"
              >
                <span class="flex items-center gap-1.5 text-sm font-semibold">
                  {{ TEAM_NAMES[group.key] }}
                  <ArrowDown class="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                </span>
                <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {{ t(`navigationPages.about.structure.${group.key}`) }}
                </span>
                <span class="mt-1 block text-xs font-medium text-primary">
                  {{ t("navigationPages.about.structure.projectCount", { count: group.projects.length }) }}
                </span>
              </button>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <!-- Contributors: one wall, each person tagged with their identities -->
    <section class="flex flex-col gap-4" aria-labelledby="about-contributors-title" data-testid="about-contributors">
      <header class="flex flex-col gap-3">
        <div class="flex flex-wrap items-baseline gap-x-2.5">
          <h2 id="about-contributors-title" class="text-xl font-bold tracking-tight">
            {{ t("navigationPages.about.contributors.title") }}
          </h2>
          <span class="text-sm tabular-nums text-muted-foreground">
            {{ t("navigationPages.about.contributors.count", { count: contributors.length }) }}
          </span>
        </div>

        <div
          class="flex flex-wrap gap-2"
          role="group"
          :aria-label="t('navigationPages.about.contributors.filterLabel')"
        >
          <button
            type="button"
            :aria-pressed="activeIdentity === null"
            :class="[
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10',
              activeIdentity === null ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted',
            ]"
            data-testid="about-identity-all"
            @click="activeIdentity = null"
          >
            {{ t("navigationPages.about.contributors.all") }}
            <span class="text-xs tabular-nums opacity-70">{{ contributors.length }}</span>
          </button>
          <button
            v-for="identity in identityFilters"
            :key="identity"
            type="button"
            :aria-pressed="activeIdentity === identity"
            :class="[
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10',
              activeIdentity === identity ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted',
            ]"
            :data-testid="`about-identity-${identity}`"
            @click="toggleIdentity(identity)"
          >
            <component :is="IDENTITY_STYLE[identity].icon" class="size-3.5" aria-hidden="true" />
            {{ t(`navigationPages.about.contributors.identities.${identity}.label`) }}
            <span class="text-xs tabular-nums opacity-70">{{ identityCounts[identity] }}</span>
          </button>
        </div>

        <p class="text-sm text-muted-foreground" aria-live="polite">{{ contributorsHint }}</p>
      </header>

      <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <li v-for="contributor in visibleContributors" :key="contributor.key" class="min-w-0">
          <a
            :href="contributor.linkUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex h-full gap-3.5 rounded-2xl border bg-card p-4 outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
            :data-testid="`about-contributor-${contributor.key}`"
          >
            <Avatar class="size-12 shrink-0 border">
              <AvatarImage :src="contributorAvatar(contributor)" alt="" loading="lazy" decoding="async" />
              <AvatarFallback class="bg-primary/5 text-sm font-semibold text-primary">
                {{ contributorName(contributor).charAt(0) }}
              </AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <p class="flex items-center gap-1.5 text-sm font-semibold">
                <span class="truncate">{{ contributorName(contributor) }}</span>
                <ExternalLink class="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </p>
              <p v-if="contributorHandle(contributor)" class="truncate text-xs text-muted-foreground">
                {{ contributorHandle(contributor) }}
              </p>
              <ul class="mt-2 flex flex-wrap gap-1">
                <li v-for="identity in orderedIdentities(contributor)" :key="identity">
                  <Badge :variant="IDENTITY_STYLE[identity].variant" size="sm">
                    <component :is="IDENTITY_STYLE[identity].icon" aria-hidden="true" />
                    {{ t(`navigationPages.about.contributors.identities.${identity}.label`) }}
                  </Badge>
                </li>
              </ul>
              <p v-if="contributorQuote(contributor)" class="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {{ contributorQuote(contributor) }}
              </p>
            </div>
          </a>
        </li>
      </ul>
    </section>

    <!-- Open source projects, by team -->
    <section class="flex flex-col gap-5" aria-labelledby="about-projects-title">
      <header>
        <h2 id="about-projects-title" class="text-xl font-bold tracking-tight">
          {{ t("navigationPages.about.projects.title") }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t("navigationPages.about.projects.subtitle") }}
        </p>
      </header>

      <div
        v-for="group in PROJECT_GROUPS"
        :id="`about-projects-${group.key}`"
        :key="group.key"
        class="scroll-mt-20 space-y-2.5"
      >
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3 class="text-sm font-semibold">
            {{ t(`navigationPages.about.projects.groups.${group.key}.title`) }}
          </h3>
          <p class="text-xs text-muted-foreground">
            {{ t(`navigationPages.about.projects.groups.${group.key}.desc`) }}
          </p>
        </div>

        <div class="overflow-hidden rounded-2xl border bg-card">
          <ul class="-mb-px -mr-px grid grid-cols-1 lg:grid-cols-2">
            <li v-for="project in group.projects" :key="project.key" class="border-b border-r">
              <a
                :href="project.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="group flex h-full items-start gap-3 px-4 py-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/60 sm:px-5"
              >
                <span :class="['mt-1.5 size-2 shrink-0 rounded-full', languageDotClass(project)]" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-primary">
                    {{ t(`navigationPages.about.projects.list.${project.key}.name`) }}
                    <ExternalLink class="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                  <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {{ t(`navigationPages.about.projects.list.${project.key}.desc`) }}
                  </span>
                  <span class="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-muted-foreground/80">
                    <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
                  </span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Support -->
    <section class="rounded-2xl border border-pink-500/20 bg-pink-500/[0.04] px-5 py-6 md:px-8">
      <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div class="space-y-1">
          <h2 class="text-lg font-bold tracking-tight">
            {{ t("navigationPages.about.support.title") }}
          </h2>
          <p class="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {{ t("navigationPages.about.support.desc") }}
          </p>
        </div>

        <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button as-child variant="brand">
            <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
              <Heart class="size-4 fill-current" />
              {{ t("navigationPages.about.support.afdianBtn") }}
            </a>
          </Button>
          <Button variant="outline" as-child>
            <router-link to="/sponsors">
              <Users class="size-4" />
              {{ t("navigationPages.about.support.sponsorsBtn") }}
            </router-link>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
