<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const { t } = useI18n()

const sectionKeys = [
  "collection",
  "usage",
  "sharing",
  "security",
  "rights",
  "contact",
] as const
</script>

<template>
  <div class="w-full flex-1 flex justify-center px-0 py-4">
    <Card class="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{{ t("legal.privacy.title") }}</CardTitle>
        <CardDescription>{{ t("legal.privacy.lastUpdated") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <p class="text-sm leading-6 text-muted-foreground">{{ t("legal.privacy.intro") }}</p>
        <section v-for="key in sectionKeys" :key="key" class="space-y-1">
          <h2 class="text-base font-semibold">{{ t(`legal.privacy.sections.${key}.title`) }}</h2>
          <p class="text-sm leading-6 text-muted-foreground">{{ t(`legal.privacy.sections.${key}.content`) }}</p>
        </section>
      </CardContent>
    </Card>
  </div>
</template>
