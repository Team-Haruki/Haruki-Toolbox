<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()
</script>

<template>
  <div class="space-y-1.5 rounded-md border bg-muted/20 p-2.5 text-xs leading-6 text-muted-foreground sm:p-3 xl:p-4">
    <p>
      {{ t("deckRecommend.attribution.originalPrefix") }}<a
        class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        href="https://github.com/xfl03"
        target="_blank"
        rel="noreferrer noopener"
      >xfl03(33)</a>{{ t("deckRecommend.attribution.originalMiddle") }}<a
        class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        href="https://github.com/xfl03/sekai-calculator"
        target="_blank"
        rel="noreferrer noopener"
      >sekai-calculator</a>{{ t("deckRecommend.attribution.originalSuffix") }}
    </p>
    <p>
      {{ t("deckRecommend.attribution.optimizationPrefix") }}<a
        class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        href="https://github.com/NeuraXmy"
        target="_blank"
        rel="noreferrer noopener"
      >{{ t("deckRecommend.attribution.neuraxmyName") }}</a>{{ t("deckRecommend.attribution.optimizationMiddle") }}<a
        class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        href="https://github.com/NeuraXmy/sekai-deck-recommend-cpp"
        target="_blank"
        rel="noreferrer noopener"
      >sekai-deck-recommend-cpp</a>
    </p>
    <p>
      {{ t("deckRecommend.attribution.enginePrefix") }}<router-link
        class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        to="/about"
      >{{ t("deckRecommend.attribution.aboutLink") }}</router-link>{{ t("deckRecommend.attribution.engineSuffix") }}
    </p>
  </div>
</template>
