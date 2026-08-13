<script setup lang="ts">
import { ScrollText } from "lucide-vue-next"
import LegalPage from "../components/LegalPage.vue"

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
  <LegalPage ns="legal.tos" :icon="ScrollText" :sections="sections" />
</template>
