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
const contactEmail = "haruki@seiunx.com"
const contactHref = `mailto:${contactEmail}`

const sections = [
  {
    key: "controller",
    paragraphKeys: ["summary"],
    bulletKeys: ["team", "contact", "region", "minors"],
  },
  {
    key: "collection",
    paragraphKeys: ["summary"],
    bulletKeys: ["account", "game", "profile", "logs", "storage"],
  },
  {
    key: "usage",
    paragraphKeys: ["summary"],
    bulletKeys: ["service", "security", "support", "advanced", "compliance"],
  },
  {
    key: "retention",
    paragraphKeys: ["summary"],
    bulletKeys: ["server", "local", "requests"],
  },
  {
    key: "sharing",
    paragraphKeys: ["summary"],
    bulletKeys: ["noSale", "harukiServices", "google", "cdn", "email"],
  },
  {
    key: "security",
    paragraphKeys: ["summary"],
    bulletKeys: ["controls", "limits"],
  },
  {
    key: "rights",
    paragraphKeys: ["summary"],
    bulletKeys: ["settings", "contact", "limits"],
  },
  {
    key: "changes",
    paragraphKeys: ["summary"],
    bulletKeys: [],
  },
  {
    key: "contact",
    paragraphKeys: ["summary"],
    bulletKeys: [],
  },
] as const
</script>

<template>
  <div class="w-full flex-1 flex justify-center px-0 py-4">
    <Card class="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{{ t("legal.privacy.title") }}</CardTitle>
        <CardDescription>{{ t("legal.privacy.lastUpdated") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <p class="text-sm leading-6 text-muted-foreground">{{ t("legal.privacy.intro") }}</p>

        <div class="rounded-md border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>{{ t("legal.privacy.contactLead") }}</span>
          <a :href="contactHref" class="font-medium text-primary underline-offset-4 hover:underline">
            {{ contactEmail }}
          </a>
        </div>

        <section v-for="section in sections" :key="section.key" class="space-y-2">
          <h2 class="text-base font-semibold">{{ t(`legal.privacy.sections.${section.key}.title`) }}</h2>
          <div class="space-y-2 text-sm leading-6 text-muted-foreground">
            <p
              v-for="paragraphKey in section.paragraphKeys"
              :key="paragraphKey"
            >
              {{ t(`legal.privacy.sections.${section.key}.paragraphs.${paragraphKey}`) }}
            </p>
            <ul v-if="section.bulletKeys.length > 0" class="ml-5 list-disc space-y-1">
              <li
                v-for="bulletKey in section.bulletKeys"
                :key="bulletKey"
              >
                {{ t(`legal.privacy.sections.${section.key}.bullets.${bulletKey}`) }}
              </li>
            </ul>
          </div>
        </section>
      </CardContent>
    </Card>
  </div>
</template>
