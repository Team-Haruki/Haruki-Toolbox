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
  "eligibility",
  "acceptableUse",
  "account",
  "availability",
  "liability",
  "changes",
  "contact",
] as const
</script>

<template>
  <div class="w-full flex-1 flex justify-center px-0 py-4">
    <Card class="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{{ t("legal.tos.title") }}</CardTitle>
        <CardDescription>{{ t("legal.tos.lastUpdated") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <p class="text-sm leading-6 text-muted-foreground">{{ t("legal.tos.intro") }}</p>
        <section v-for="key in sectionKeys" :key="key" class="space-y-1">
          <h2 class="text-base font-semibold">{{ t(`legal.tos.sections.${key}.title`) }}</h2>
          <p class="text-sm leading-6 text-muted-foreground">{{ t(`legal.tos.sections.${key}.content`) }}</p>
        </section>
      </CardContent>
    </Card>
  </div>
</template>
