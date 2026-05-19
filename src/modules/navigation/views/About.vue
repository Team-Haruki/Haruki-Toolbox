<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  Code2, 
  Heart, 
  ExternalLink,
  Sparkles
} from "lucide-vue-next"

const { t, te } = useI18n()

const hasQuote = (memberKey: string) => {
  const quoteKey = `navigationPages.about.team.members.${memberKey}.quote`
  return te(quoteKey) && t(quoteKey) !== quoteKey
}

const hasDesc = (memberKey: string) => {
  const descKey = `navigationPages.about.team.members.${memberKey}.desc`
  return te(descKey) && t(descKey) !== descKey && t(descKey) !== ""
}

// Developer team member structure
interface TeamMember {
  key: string // used for i18n lookup
  github?: string
  avatar?: string
  roleKey: 'core' | 'doc' | 'contrib' | 'sponsor'
  linkUrl: string
}

const teamMembers: TeamMember[] = [
  // Core developers
  { key: "seiun", github: "seiunx", roleKey: "core", linkUrl: "https://github.com/seiunx" },
  { key: "lingqian", roleKey: "core", linkUrl: "https://github.com/Team-Haruki" },
  { key: "deseer", github: "Deseer", roleKey: "core", linkUrl: "https://github.com/Deseer" },
  { key: "storyxy", github: "storyxy", roleKey: "core", linkUrl: "https://github.com/storyxy" },
  
  // Documentation maintainers
  { key: "aposetles", github: "Aposetles", roleKey: "doc", linkUrl: "https://github.com/Aposetles" },
  { key: "tianshinling", roleKey: "doc", linkUrl: "https://github.com/Team-Haruki" },
  { key: "yangzi", roleKey: "doc", linkUrl: "https://github.com/Team-Haruki" },
  
  // External collaborators
  { key: "watagashi", roleKey: "contrib", linkUrl: "https://github.com/Team-Haruki" },
  { key: "middlered", github: "MiddleRed", roleKey: "contrib", linkUrl: "https://github.com/MiddleRed" },
  { key: "dnaroma", github: "DNARoma", roleKey: "contrib", linkUrl: "https://github.com/DNARoma" },
  
  // Gold Sponsors
  { key: "yamamoto", roleKey: "sponsor", linkUrl: "https://github.com/Team-Haruki" }
]

// Open source project structure
interface Project {
  key: string // used for i18n lookup
  tags: string[]
  githubUrl: string
}

const projectsList: Project[] = [
  { key: "drawingEngine", tags: ["Python", "FastAPI", "Pillow"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "botBackend", tags: ["Go", "Fiber", "EntGo", "PostgreSQL"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "toolboxBackend", tags: ["Go", "Fiber", "EntGo", "PostgreSQL", "MongoDB"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "deckService", tags: ["Rust", "Axum", "Tokio"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "deckCpp", tags: ["C++", "FastJSON"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "scoresRs", tags: ["Rust", "Skia"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "toolbox", tags: ["TypeScript", "Vue 3", "Vite", "Tailwind"], githubUrl: "https://github.com/Team-Haruki/Haruki-Toolbox" },
  { key: "assetUpdater", tags: ["Rust", "Axum", "Cridecoder"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "sekaiApi", tags: ["Rust", "Axum", "SeaORM"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "eventTracker", tags: ["Rust", "Axum", "SeaORM"], githubUrl: "https://github.com/Team-Haruki" },
  { key: "cridecoder", tags: ["Rust"], githubUrl: "https://github.com/Team-Haruki" }
]

const getTagClass = (tag: string) => {
  const t = tag.toLowerCase()
  if (t === "rust" || t === "cridecoder") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
  }
  if (t === "go" || t === "entgo" || t === "fiber" || t === "postgresql" || t === "mongodb") {
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
  }
  if (t === "python" || t === "fastapi" || t === "pillow") {
    return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
  }
  if (t === "c++") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
  }
  if (t === "vue 3" || t === "vite" || t === "tailwind" || t === "typescript" || t === "javascript") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
  }
  return "bg-secondary text-secondary-foreground border border-transparent"
}

// Group members by role category for structured presentation
const groupedMembers = {
  core: teamMembers.filter(m => m.roleKey === 'core'),
  doc: teamMembers.filter(m => m.roleKey === 'doc'),
  contrib: teamMembers.filter(m => m.roleKey === 'contrib'),
  sponsor: teamMembers.filter(m => m.roleKey === 'sponsor')
}

const showSponsorsMaintenance = () => {
  toast.info(t("navigationPages.about.support.sponsorsMaintenance"))
}
</script>

<template>
  <div class="w-full flex-1 px-4 py-8 space-y-10 max-w-5xl mx-auto">
    
    <!-- Simplified typographic Header Section -->
    <div class="space-y-4 max-w-3xl">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
        <div class="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary shrink-0">
          <Sparkles class="w-6 h-6 md:w-7 md:h-7" />
        </div>
        <span>{{ t("navigationPages.about.title") }}</span>
      </h1>
      <p class="text-base md:text-lg font-semibold text-primary">
        {{ t("navigationPages.about.subtitle") }}
      </p>
      <div class="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed pt-2">
        <p>{{ t("navigationPages.about.projectIntro.p1") }}</p>
        <p>{{ t("navigationPages.about.projectIntro.p2") }}</p>
        <p>{{ t("navigationPages.about.projectIntro.p3") }}</p>
      </div>
    </div>

    <Separator class="my-6" />

    <!-- Dev Team Section -->
    <section class="space-y-6">
      <div class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Users class="w-6 h-6 text-primary" />
        <h2>{{ t("navigationPages.about.team.title") }}</h2>
      </div>
      
      <p class="text-muted-foreground text-sm -mt-2">
        {{ t("navigationPages.about.team.subtitle") }}
      </p>

      <div class="space-y-8">
        <!-- Render each category -->
        <div v-for="(group, key) in groupedMembers" :key="key" class="space-y-3">
          <div class="space-y-1">
            <h3 class="text-lg font-semibold text-foreground/85 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary" />
              {{ t(`navigationPages.about.team.roles.${key}`) }}
            </h3>
            <p class="text-xs text-muted-foreground pl-4 leading-normal">
              {{ t(`navigationPages.about.team.roleDescs.${key}`) }}
            </p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              v-for="member in group"
              :key="member.key"
              :href="member.linkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="block group outline-none"
            >
              <Card class="h-full border border-muted/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer">
                <CardHeader class="flex flex-row items-center gap-4 pb-3">
                  <Avatar class="h-10 w-10 border border-muted/80 transition-colors duration-300 group-hover:border-primary">
                    <AvatarImage 
                      :src="member.avatar || (member.github ? `https://github.com/${member.github}.png` : '')" 
                      :alt="t(`navigationPages.about.team.members.${member.key}.name`)" 
                    />
                    <AvatarFallback class="bg-primary/5 text-primary text-sm font-semibold">
                      {{ t(`navigationPages.about.team.members.${member.key}.name`).charAt(0) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-sm font-semibold group-hover:text-primary transition-colors flex items-center gap-1">
                      <span class="truncate">{{ t(`navigationPages.about.team.members.${member.key}.name`) }}</span>
                      <ExternalLink class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </CardTitle>
                    <span class="text-[10px] text-muted-foreground/80 font-medium">
                      {{ t(`navigationPages.about.team.members.${member.key}.role`) }}
                    </span>
                  </div>
                </CardHeader>
                <CardContent v-if="hasDesc(member.key) || hasQuote(member.key)" class="pt-0 space-y-2">
                  <CardDescription 
                    v-if="hasDesc(member.key)"
                    class="text-xs line-clamp-2 leading-relaxed"
                  >
                    {{ t(`navigationPages.about.team.members.${member.key}.desc`) }}
                  </CardDescription>
                  <div 
                    v-if="hasQuote(member.key)"
                    class="text-[10px] text-primary/80 italic border-l-2 border-primary/30 pl-2 py-0.5 mt-2 line-clamp-2 font-medium bg-primary/[0.02] rounded-r"
                  >
                    {{ t(`navigationPages.about.team.members.${member.key}.quote`) }}
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Open Source Projects Section -->
    <section class="space-y-6">
      <div class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Code2 class="w-6 h-6 text-primary" />
        <h2>{{ t("navigationPages.about.projects.title") }}</h2>
      </div>

      <p class="text-muted-foreground text-sm -mt-2">
        {{ t("navigationPages.about.projects.subtitle") }}
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a 
          v-for="project in projectsList" 
          :key="project.key"
          :href="project.githubUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="block group outline-none"
        >
          <Card class="h-full border border-muted/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer">
            <CardHeader class="pb-2">
              <div class="flex items-start justify-between gap-2">
                <CardTitle class="text-base font-bold group-hover:text-primary transition-colors flex items-center gap-1.5 leading-snug">
                  <span class="line-clamp-1">{{ t(`navigationPages.about.projects.list.${project.key}.name`) }}</span>
                  <ExternalLink class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </CardTitle>
              </div>
              
              <!-- Tech tags -->
              <div class="flex flex-wrap gap-1 mt-2">
                <span 
                  v-for="tag in project.tags" 
                  :key="tag"
                  :class="['text-[10px] px-1.5 py-0.5 rounded-md font-medium', getTagClass(tag)]"
                >
                  {{ tag }}
                </span>
              </div>
            </CardHeader>
            <CardContent class="pt-2">
              <CardDescription class="text-xs line-clamp-3 leading-relaxed">
                {{ t(`navigationPages.about.projects.list.${project.key}.desc`) }}
              </CardDescription>
            </CardContent>
          </Card>
        </a>
      </div>
    </section>

    <!-- Support Section -->
    <section class="space-y-4">
      <div class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Heart class="w-6 h-6 text-primary animate-pulse" />
        <h2>{{ t("navigationPages.about.support.title") }}</h2>
      </div>
      
      <div class="bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-primary/5 border border-pink-500/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl text-center md:text-left">
          <p class="text-muted-foreground text-sm md:text-base leading-relaxed">
            {{ t("navigationPages.about.support.desc") }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            as-child
            class="bg-pink-600 hover:bg-pink-700 text-white font-semibold flex items-center justify-center gap-2 h-11 px-6 shadow-sm hover:shadow transition-all duration-300 hover:scale-[1.02]"
          >
            <a href="https://afdian.com/a/seiunx" target="_blank" rel="noopener noreferrer">
              <Heart class="w-4 h-4 fill-current" />
              {{ t("navigationPages.about.support.afdianBtn") }}
            </a>
          </Button>

          <Button 
            variant="outline"
            class="h-11 px-6 font-semibold flex items-center justify-center gap-2 border-muted/80 hover:bg-muted/30 transition-all duration-300 hover:scale-[1.02]"
            @click="showSponsorsMaintenance"
          >
            <Users class="w-4 h-4" />
            {{ t("navigationPages.about.support.sponsorsBtn") }}
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
