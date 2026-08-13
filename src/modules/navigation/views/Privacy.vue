<script setup lang="ts">
import { ShieldCheck } from "lucide-vue-next"
import LegalPage from "../components/LegalPage.vue"

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
  <LegalPage ns="legal.privacy" :icon="ShieldCheck" :sections="sections" />
</template>
