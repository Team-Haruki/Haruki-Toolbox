<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Code2,
  Crown,
  ExternalLink,
  Github,
  Heart,
  Users,
} from "lucide-vue-next"

const HARUKI_LOGO = `${import.meta.env.BASE_URL}assets/haruki.ico`
const GITHUB_ORG_URL = "https://github.com/Team-Haruki"
const AFDIAN_URL = "https://afdian.com/a/seiunx"

const { t, te } = useI18n()
const settingsStore = useSettingsStore()

// Quotes exist only for some members; vue-i18n's fallback chain covers the
// locale side, so presence is all we need to check.
function memberQuote(memberKey: string): string {
  const quoteKey = `navigationPages.about.team.members.${memberKey}.quote`
  return te(quoteKey) ? t(quoteKey) : ""
}

function memberAvatarUrl(member: TeamMember): string {
  if (member.avatar) {
    if (member.avatar.startsWith("http://") || member.avatar.startsWith("https://")) {
      return member.avatar
    }
    return `${settingsStore.currentEndpoint}${member.avatar.startsWith("/") ? "" : "/"}${member.avatar}`
  }
  return member.github ? `https://github.com/${member.github}.png` : ""
}

interface TeamMember {
  key: string
  github?: string
  avatar?: string
  roleKey: "core" | "doc" | "contrib" | "sponsor"
  linkUrl: string
}

const teamMembers: TeamMember[] = [
  { key: "seiun", github: "MejiroRina", roleKey: "core", linkUrl: "https://seiun.io" },
  { key: "lingqian", github: "xuanmingLQ", roleKey: "core", linkUrl: "https://github.com/xuanmingLQ" },
  { key: "deseer", github: "Deseer", roleKey: "core", linkUrl: "https://github.com/Deseer" },
  { key: "storyxy", github: "storyxy3", roleKey: "core", linkUrl: "https://github.com/storyxy3" },
  { key: "aposetles", github: "Aposetles", roleKey: "doc", linkUrl: "https://space.bilibili.com/178748972" },
  { key: "tianshinling", github: "YoisakiKnd", roleKey: "doc", linkUrl: "https://ty0.icu/about/" },
  { key: "yangzi", github: "IwasakiYouko", roleKey: "doc", linkUrl: "https://dick.plus" },
  { key: "watagashi", github: "watagashi-uni", roleKey: "contrib", linkUrl: "https://github.com/watagashi-uni" },
  { key: "middlered", github: "MiddleRed", roleKey: "contrib", linkUrl: "https://mid.red" },
  { key: "dnaroma", github: "DNARoma", roleKey: "contrib", linkUrl: "https://blog.dna.moe/about/" },
  { key: "yamamoto", github: "Yamamoto-2", roleKey: "sponsor", linkUrl: "https://github.com/Yamamoto-2" },
]

const groupedMembers = {
  core: teamMembers.filter((member) => member.roleKey === "core"),
  doc: teamMembers.filter((member) => member.roleKey === "doc"),
  contrib: teamMembers.filter((member) => member.roleKey === "contrib"),
  sponsor: teamMembers.filter((member) => member.roleKey === "sponsor"),
}

interface Project {
  key: string
  tags: string[]
  githubUrl: string
}

const projectsList: Project[] = [
  { key: "toolbox", tags: ["TypeScript", "Vue 3", "Vite", "Shadcn-Vue", "Tailwind"], githubUrl: "https://github.com/Team-Haruki/Haruki-Toolbox" },
  { key: "toolboxBackend", tags: ["Go", "Fiber", "EntGo", "PostgreSQL", "MongoDB"], githubUrl: "https://github.com/Team-Haruki/Haruki-Toolbox-Backend" },
  { key: "botBackend", tags: ["Go", "Fiber", "EntGo", "PostgreSQL"], githubUrl: "https://github.com/Team-Haruki/Haruki-Cloud" },
  { key: "sekaiApi", tags: ["Rust", "Axum", "Tokio", "SeaORM"], githubUrl: "https://github.com/Team-Haruki/Haruki-Sekai-API" },
  { key: "eventTracker", tags: ["Rust", "Axum", "Tokio", "SeaORM"], githubUrl: "https://github.com/Team-Haruki/Haruki-Event-Tracker" },
  { key: "assetUpdater", tags: ["Rust", "Axum", "Tokio", "Cridecoder"], githubUrl: "https://github.com/Team-Haruki/Haruki-Sekai-Asset-Updater" },
  { key: "deckService", tags: ["Rust", "Axum", "Tokio"], githubUrl: "https://github.com/Team-Haruki/deck-service" },
  { key: "deckCpp", tags: ["C++", "yyjson"], githubUrl: "https://github.com/Team-Haruki/sekai-deck-recommend-cpp" },
  { key: "scoresRs", tags: ["Rust", "Skia"], githubUrl: "https://github.com/Team-Haruki/pjsekai-scores-rs" },
  { key: "drawingEngine", tags: ["Python", "FastAPI", "Pillow"], githubUrl: "https://github.com/Team-Haruki/Haruki-Drawing-API" },
  { key: "cridecoder", tags: ["Rust"], githubUrl: "https://github.com/Team-Haruki/cridecoder" },
]

// One dot color per primary language keeps the tag row quiet; the first tag
// of every project is its language.
const LANGUAGE_DOT: Record<string, string> = {
  "typescript": "bg-emerald-500",
  "go": "bg-sky-500",
  "rust": "bg-amber-500",
  "c++": "bg-rose-500",
  "python": "bg-yellow-500",
}

function languageDotClass(project: Project): string {
  return LANGUAGE_DOT[project.tags[0]?.toLowerCase() ?? ""] ?? "bg-muted-foreground"
}
</script>

<template>
  <div class="w-full flex-1 px-4 py-6 max-w-5xl mx-auto flex flex-col gap-10">
    <!-- Hero -->
    <section class="flex flex-col gap-4 border-b pb-8 pt-2 md:pt-4">
      <p class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <span class="h-px w-8 bg-current opacity-60" aria-hidden="true" />
        {{ t("navigationPages.about.subtitle") }}
      </p>

      <div class="flex items-center gap-3.5">
        <Avatar class="h-12 w-12 shrink-0">
          <AvatarImage :src="HARUKI_LOGO" alt="Project Haruki" />
          <AvatarFallback class="text-base font-bold text-primary">PH</AvatarFallback>
        </Avatar>
        <h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">
          {{ t("navigationPages.about.title") }}
        </h1>
      </div>

      <div class="max-w-3xl space-y-2.5 text-sm leading-relaxed text-muted-foreground md:text-base">
        <p>{{ t("navigationPages.about.projectIntro.p1Before") }}<span class="font-semibold text-foreground">{{ t("navigationPages.about.projectIntro.p1Name") }}</span>{{ t("navigationPages.about.projectIntro.p1After") }}</p>
        <p>{{ t("navigationPages.about.projectIntro.p2") }}</p>
        <p>{{ t("navigationPages.about.projectIntro.p3") }}</p>
      </div>

      <div class="mt-1 flex flex-wrap gap-3">
        <Button as-child class="h-10 px-5 font-semibold">
          <a :href="GITHUB_ORG_URL" target="_blank" rel="noopener noreferrer">
            <Github class="h-4 w-4" />
            Team-Haruki
            <ExternalLink class="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          as-child
          variant="outline"
          class="h-10 px-5 font-semibold border-pink-500/30 text-pink-600 hover:bg-pink-500/10 hover:text-pink-600 dark:text-pink-300 dark:hover:text-pink-300"
        >
          <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
            <Heart class="h-4 w-4 fill-current" />
            {{ t("navigationPages.about.support.afdianBtn") }}
          </a>
        </Button>
      </div>
    </section>

    <!-- Team -->
    <section class="space-y-5">
      <header class="space-y-1">
        <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users class="h-6 w-6 text-primary" />
          {{ t("navigationPages.about.team.title") }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ t("navigationPages.about.team.subtitle") }}
        </p>
      </header>

      <div class="space-y-7">
        <div v-for="(group, key) in groupedMembers" :key="key" class="space-y-3">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3 class="text-base font-semibold">
              {{ t(`navigationPages.about.team.roles.${key}`) }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ t(`navigationPages.about.team.roleDescs.${key}`) }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              v-for="member in group"
              :key="member.key"
              :href="member.linkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex h-full flex-col gap-2.5 rounded-xl border bg-card p-4 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div class="flex items-center gap-3">
                <Avatar class="h-10 w-10 border transition-colors duration-200 group-hover:border-primary/60">
                  <AvatarImage
                    :src="memberAvatarUrl(member)"
                    :alt="t(`navigationPages.about.team.members.${member.key}.name`)"
                    loading="lazy"
                    decoding="async"
                  />
                  <AvatarFallback class="bg-primary/5 text-sm font-semibold text-primary">
                    {{ t(`navigationPages.about.team.members.${member.key}.name`).charAt(0) }}
                  </AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-1 text-sm font-semibold transition-colors group-hover:text-primary">
                    <span class="truncate">{{ t(`navigationPages.about.team.members.${member.key}.name`) }}</span>
                    <Crown
                      v-if="member.roleKey === 'sponsor'"
                      class="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400"
                    />
                    <ExternalLink class="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <p class="truncate text-xs font-medium text-muted-foreground/80">
                    {{ t(`navigationPages.about.team.members.${member.key}.role`) }}
                  </p>
                </div>
              </div>
              <p
                v-if="memberQuote(member.key)"
                class="line-clamp-2 rounded-r border-l-2 border-primary/30 bg-primary/[0.03] py-0.5 pl-2 text-xs font-medium italic text-primary/80"
              >
                {{ memberQuote(member.key) }}
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Open source projects -->
    <section class="space-y-5">
      <header class="space-y-1">
        <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Code2 class="h-6 w-6 text-primary" />
          {{ t("navigationPages.about.projects.title") }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ t("navigationPages.about.projects.subtitle") }}
        </p>
      </header>

      <div class="overflow-hidden rounded-xl border bg-card">
        <a
          v-for="project in projectsList"
          :key="project.key"
          :href="project.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-start gap-3 border-b px-4 py-3.5 outline-none transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5"
        >
          <span :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', languageDotClass(project)]" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-baseline gap-x-2">
              <span class="text-sm font-semibold transition-colors group-hover:text-primary">
                {{ t(`navigationPages.about.projects.list.${project.key}.name`) }}
              </span>
              <span class="text-[11px] font-medium text-muted-foreground/70">
                {{ project.tags.join(" · ") }}
              </span>
            </span>
            <span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-1">
              {{ t(`navigationPages.about.projects.list.${project.key}.desc`) }}
            </span>
          </span>
          <ExternalLink class="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </div>
    </section>

    <!-- Support band -->
    <section class="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-500/[0.04] px-6 py-7 md:px-8">
      <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-300">
            <Heart class="h-5 w-5 fill-current" />
          </span>
          <div class="space-y-1">
            <h2 class="text-lg font-bold tracking-tight">
              {{ t("navigationPages.about.support.title") }}
            </h2>
            <p class="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {{ t("navigationPages.about.support.desc") }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button
            as-child
            class="h-10 bg-pink-600 px-5 font-semibold text-white transition-colors hover:bg-pink-700"
          >
            <a :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
              <Heart class="h-4 w-4 fill-current" />
              {{ t("navigationPages.about.support.afdianBtn") }}
            </a>
          </Button>
          <Button variant="outline" as-child class="h-10 px-5 font-semibold">
            <router-link to="/sponsors">
              <Users class="h-4 w-4" />
              {{ t("navigationPages.about.support.sponsorsBtn") }}
            </router-link>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
