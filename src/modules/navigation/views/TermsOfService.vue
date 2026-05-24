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
    key: "scope",
    paragraphKeys: ["summary"],
    bulletKeys: ["team", "unofficial", "global"],
  },
  {
    key: "account",
    paragraphKeys: ["summary"],
    bulletKeys: ["credentials", "dataAccuracy", "adminSupport"],
  },
  {
    key: "acceptableUse",
    paragraphKeys: ["summary"],
    bulletKeys: ["lawful", "automation", "security", "rateLimit"],
  },
  {
    key: "dataUse",
    paragraphKeys: ["summary"],
    bulletKeys: ["harukiServices", "thirdParty", "oauth"],
  },
  {
    key: "betaFeatures",
    paragraphKeys: ["summary"],
    bulletKeys: ["deckRecommend", "scoreControl", "noGuarantee"],
  },
  {
    key: "gameAccountRisk",
    paragraphKeys: ["summary"],
    bulletKeys: ["transferCode", "accountLoss"],
  },
  {
    key: "availability",
    paragraphKeys: ["summary"],
    bulletKeys: ["changes", "thirdParty"],
  },
  {
    key: "enforcement",
    paragraphKeys: ["summary"],
    bulletKeys: ["ban", "data"],
  },
  {
    key: "links",
    paragraphKeys: ["summary"],
    bulletKeys: ["external", "openSource"],
  },
  {
    key: "liability",
    paragraphKeys: ["summary"],
    bulletKeys: ["scope"],
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
        <CardTitle>{{ t("legal.tos.title") }}</CardTitle>
        <CardDescription>{{ t("legal.tos.lastUpdated") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <p class="text-sm leading-6 text-muted-foreground">{{ t("legal.tos.intro") }}</p>

        <div class="rounded-md border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>{{ t("legal.tos.contactLead") }}</span>
          <a :href="contactHref" class="font-medium text-primary underline-offset-4 hover:underline">
            {{ contactEmail }}
          </a>
        </div>

        <section v-for="section in sections" :key="section.key" class="space-y-2">
          <h2 class="text-base font-semibold">{{ t(`legal.tos.sections.${section.key}.title`) }}</h2>
          <div class="space-y-2 text-sm leading-6 text-muted-foreground">
            <p
              v-for="paragraphKey in section.paragraphKeys"
              :key="paragraphKey"
            >
              {{ t(`legal.tos.sections.${section.key}.paragraphs.${paragraphKey}`) }}
            </p>
            <ul v-if="section.bulletKeys.length > 0" class="ml-5 list-disc space-y-1">
              <li
                v-for="bulletKey in section.bulletKeys"
                :key="bulletKey"
              >
                {{ t(`legal.tos.sections.${section.key}.bullets.${bulletKey}`) }}
              </li>
            </ul>
          </div>
        </section>
      </CardContent>
    </Card>
  </div>
</template>
