<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n()

// Inline credit links inside running text: on touch devices an invisible
// vertical padding (cancelled by the negative margin, so the line box does not
// grow) lifts the hit area to 40 px without changing how the paragraph reads.
const linkClass = "font-medium text-foreground underline underline-offset-2 hover:text-primary pointer-coarse:-my-2 pointer-coarse:inline-block pointer-coarse:py-2"
</script>

<template>
  <div class="space-y-0.5 border-t border-border/60 px-3 pt-3 text-xs leading-5 text-muted-foreground sm:px-0">
    <p>
      {{ t("deckRecommend.attribution.originalPrefix") }}<a
        :class="linkClass"
        href="https://github.com/xfl03"
        target="_blank"
        rel="noreferrer noopener"
      >xfl03(33)</a>{{ t("deckRecommend.attribution.originalMiddle") }}<a
        :class="linkClass"
        href="https://github.com/xfl03/sekai-calculator"
        target="_blank"
        rel="noreferrer noopener"
      >sekai-calculator</a>{{ t("deckRecommend.attribution.originalSuffix") }}
    </p>
    <p>
      {{ t("deckRecommend.attribution.optimizationPrefix") }}<a
        :class="linkClass"
        href="https://github.com/NeuraXmy"
        target="_blank"
        rel="noreferrer noopener"
      >{{ t("deckRecommend.attribution.neuraxmyName") }}</a>{{ t("deckRecommend.attribution.optimizationMiddle") }}<a
        :class="linkClass"
        href="https://github.com/NeuraXmy/sekai-deck-recommend-cpp"
        target="_blank"
        rel="noreferrer noopener"
      >sekai-deck-recommend-cpp</a>
    </p>
    <p>
      {{ t("deckRecommend.attribution.enginePrefix") }}<router-link
        :class="linkClass"
        to="/about"
      >{{ t("deckRecommend.attribution.aboutLink") }}</router-link>{{ t("deckRecommend.attribution.engineSuffix") }}
    </p>
  </div>
</template>
