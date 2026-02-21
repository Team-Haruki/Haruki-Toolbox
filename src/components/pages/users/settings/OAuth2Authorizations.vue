<script setup lang="ts">
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import { Button } from "@/components/ui/button"
import { KeyRound, Trash2, X } from "lucide-vue-next"
import { extractErrorMessage } from "@/lib/error-utils"

import { ref, onMounted } from "vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  listOAuthAuthorizations,
  revokeOAuthAuthorization,
  getScopeLabel,
  type OAuthAuthorization,
} from "@/api"


const userStore = useUserStore()
const authorizations = ref<OAuthAuthorization[]>([])
const isLoading = ref(false)
const showRevokeDialog = ref(false)
const revokeTarget = ref<OAuthAuthorization | null>(null)

async function fetchAuthorizations() {
  if (!userStore.userId) return
  isLoading.value = true
  try {
    const resp = await listOAuthAuthorizations(userStore.userId, { skipErrorToast: true })
    authorizations.value = resp.updatedData ?? []
  } catch (e: unknown) {
    toast.error("获取授权列表失败", { description: extractErrorMessage(e, "获取失败") })
  } finally {
    isLoading.value = false
  }
}

function confirmRevoke(auth: OAuthAuthorization) {
  revokeTarget.value = auth
  showRevokeDialog.value = true
}

async function handleRevoke() {
  if (!revokeTarget.value || !userStore.userId) return
  try {
    await revokeOAuthAuthorization(userStore.userId, revokeTarget.value.clientId, { skipErrorToast: true })
    toast.success("已撤销授权", { description: `已撤销 ${revokeTarget.value.clientName} 的访问权限` })
    showRevokeDialog.value = false
    await fetchAuthorizations()
  } catch (e: unknown) {
    toast.error("撤销失败", { description: extractErrorMessage(e, "撤销失败") })
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return iso
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchAuthorizations()
  }
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <div>
        <CardTitle class="flex items-center gap-2">
          <KeyRound class="h-6 w-6" />
          第三方应用授权
        </CardTitle>
        <CardDescription>管理已授权访问您账号数据的第三方应用</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="text-center text-muted-foreground py-6">
        加载中...
      </div>
      <div v-else-if="authorizations.length === 0" class="text-center text-muted-foreground py-6">
        暂无已授权的第三方应用
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="auth in authorizations"
          :key="auth.clientId"
          class="flex items-start justify-between gap-3 rounded-lg border p-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">{{ auth.clientName }}</span>
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                {{ auth.clientType === 'confidential' ? 'Bot' : '网站' }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="scope in auth.scopes"
                :key="scope"
                class="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
              >
                {{ getScopeLabel(scope) }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              授权于 {{ formatDate(auth.createdAt) }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive shrink-0"
            @click="confirmRevoke(auth)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  <AlertDialog v-model:open="showRevokeDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>撤销授权</AlertDialogTitle>
        <AlertDialogDescription>
          确认撤销 <strong>{{ revokeTarget?.clientName }}</strong> 的所有访问权限吗？该应用将无法再访问您的数据。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          取消
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" @click="handleRevoke">
          <Trash2 class="h-4 w-4 mr-2" />
          撤销
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
