<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/store"
import { useSettingsStore } from "@/settingsStore"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldX } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { getScopeLabel } from "@/api"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const isSubmitting = ref(false)

// Parse query params from the authorization server redirect
const clientId = computed(() => String(route.query.client_id ?? ""))
const clientName = computed(() => String(route.query.client_name ?? "未知应用"))
const scopeStr = computed(() => String(route.query.scope ?? ""))
const redirectUri = computed(() => String(route.query.redirect_uri ?? ""))
const state = computed(() => String(route.query.state ?? ""))
const codeChallenge = computed(() => String(route.query.code_challenge ?? ""))
const codeChallengeMethod = computed(() => String(route.query.code_challenge_method ?? ""))

const scopes = computed(() =>
  scopeStr.value ? scopeStr.value.split(" ").filter(Boolean) : []
)

const isValid = computed(() =>
  clientId.value !== "" && redirectUri.value !== "" && scopes.value.length > 0
)

async function submitConsent(approved: boolean) {
  if (!userStore.userId || !userStore.sessionToken) {
    toast.error("请先登录", { description: "您需要登录后才能授权第三方应用" })
    router.push("/user/login")
    return
  }

  isSubmitting.value = true
  try {
    const payload: Record<string, unknown> = {
      client_id: clientId.value,
      redirect_uri: redirectUri.value,
      scope: scopeStr.value,
      state: state.value,
      approved,
    }
    if (codeChallenge.value) {
      payload.code_challenge = codeChallenge.value
      payload.code_challenge_method = codeChallengeMethod.value
    }

    const response = await fetch(`${settingsStore.currentEndpoint}/api/oauth2/authorize/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userStore.sessionToken}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      toast.error("授权失败", { description: data?.message || data?.error_description || "请求失败" })
      return
    }

    // Backend returns { redirect_url: "..." }
    if (data?.redirect_url) {
      window.location.href = data.redirect_url
      return
    }

    toast.error("授权失败", { description: "未收到重定向地址" })
  } catch (e) {
    toast.error("请求失败", { description: "无法完成授权，请重试" })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    toast.info("请先登录", { description: "登录后将返回授权页面" })
    const currentPath = route.fullPath
    router.push(`/user/login?redirect=${encodeURIComponent(currentPath)}`)
  }
})
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md" v-if="isValid">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">授权请求</CardTitle>
        <CardDescription>
          <strong class="text-foreground">{{ clientName }}</strong> 请求访问您的 Haruki Toolbox 账号
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground mb-2">该应用将能够：</p>
            <ul class="space-y-2">
              <li
                v-for="scope in scopes"
                :key="scope"
                class="flex items-center gap-2 text-sm"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {{ getScopeLabel(scope) }}
              </li>
            </ul>
          </div>
          <div class="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            授权后，您可以随时在「账号设置 → 第三方应用授权」中撤销。
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(false)"
        >
          <ShieldX class="h-4 w-4 mr-2" />
          拒绝
        </Button>
        <Button
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(true)"
        >
          <ShieldCheck class="h-4 w-4 mr-2" />
          {{ isSubmitting ? "授权中..." : "授权" }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl text-destructive">无效的授权请求</CardTitle>
        <CardDescription>
          缺少必要参数，请检查授权链接是否完整。
        </CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button variant="outline" @click="router.push('/')">
          返回首页
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
