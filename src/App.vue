<template>
  <router-view></router-view>
  <Toaster position="top-right" richColors/>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { getSettings } from "@/modules/user-settings/api/get-settings"
import { useI18n } from "vue-i18n"
import {
  computed,
  ref,
  watch
} from "vue"
import {Toaster} from "@/components/ui/sonner";

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const syncingSettings = ref(false)
const syncedUserId = ref<string | null>(null)
const { t } = useI18n()

async function syncUserSettings(userId: string) {
  if (syncingSettings.value || syncedUserId.value === userId) return
  syncingSettings.value = true
  syncedUserId.value = userId
  try {
    const response = await getSettings(userId)
    if (response.status === 200 && response.updatedData) {
      userStore.setUser(response.updatedData)
      toast.success(t("core.sync.successTitle"), {
        description: t("core.sync.successDescription"),
      })
    }
  } catch (e) {
    console.error("Failed to sync settings:", e)
  } finally {
    syncingSettings.value = false
  }
}

watch(
  [isLoggedIn, () => userStore.userId],
  ([loggedIn, userId]) => {
    if (loggedIn && userId) {
      void syncUserSettings(userId)
    } else {
      syncedUserId.value = null
    }
  },
  { immediate: true }
)
</script>
