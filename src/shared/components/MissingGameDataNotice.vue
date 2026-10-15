<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { LucideCloudUpload } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import type { MissingUploadDataType } from "@/shared/sekai/user-snapshot/missing-data"

withDefaults(defineProps<{ granted?: boolean; dataType?: MissingUploadDataType }>(), {
  granted: false,
  dataType: "suite",
})
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center gap-3 text-center" role="status">
    <LucideCloudUpload class="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
    <p class="text-sm font-medium">{{ t("uploadedGameData.missingTitle") }}</p>
    <p class="max-w-md text-sm text-muted-foreground">
      {{ t(granted ? "uploadedGameData.missingGranted" : `uploadedGameData.missing.${dataType}`) }}
    </p>
    <Button as-child size="sm">
      <RouterLink to="/upload-data">
        <LucideCloudUpload class="size-4" aria-hidden="true" />
        {{ t("uploadedGameData.uploadAction") }}
      </RouterLink>
    </Button>
  </div>
</template>
