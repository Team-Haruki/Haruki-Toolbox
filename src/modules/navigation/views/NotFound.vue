<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { LucideCompass, LucideHome, LucideArrowLeft } from "lucide-vue-next"

const router = useRouter()
const { t } = useI18n()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push("/")
  }
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <LucideCompass class="h-8 w-8" />
    </div>
    <div class="space-y-2">
      <p class="text-sm font-bold tracking-widest text-primary">404</p>
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t("navigation.notFound.title") }}</h1>
      <p class="mx-auto max-w-md text-sm text-muted-foreground">{{ t("navigation.notFound.description") }}</p>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <Button as-child>
        <router-link to="/">
          <LucideHome class="mr-2 h-4 w-4" />
          {{ t("navigation.notFound.backHome") }}
        </router-link>
      </Button>
      <Button variant="outline" @click="goBack">
        <LucideArrowLeft class="mr-2 h-4 w-4" />
        {{ t("navigation.notFound.backPrevious") }}
      </Button>
    </div>
  </div>
</template>
