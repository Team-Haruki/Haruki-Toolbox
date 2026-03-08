<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideArrowLeft,
  LucideBan,
  LucideShieldOff,
  LucideLogOut,
  LucideRefreshCw,
  LucideTrash2,
  LucideUndo2,
  LucideLoader2,
  LucideCheckCircle2,
  LucidePencil,
  LucideMessageCircle,
  LucideBot,
  LucideMonitor,
  LucideSend,
  LucideGlobe,
  LucideShieldAlert,
  LucideShield,
  LucideUser,
  LucideXCircle,
  LucideMoreHorizontal,
} from "lucide-vue-next"
import { useUserStore } from "@/store"
import {
  getUserDetail,
  getUserActivity,
  banUser,
  unbanUser,
  forceLogout,
  deleteUser,
  restoreUser,
  resetPassword,
  updateUserRole,
  updateUserEmail,
  updateAllowCNMysekai,
  getUserOAuthAuthorizations,
  revokeUserOAuth,
  getGameAccountBindings,
  updateGameAccountBinding,
  deleteGameAccountBinding,
  getSocialPlatform,
  updateSocialPlatform,
  deleteSocialPlatform,
  getAuthorizedSocialPlatforms,
  updateAuthorizedSocialPlatform,
  deleteAuthorizedSocialPlatform,
  regenerateIOSUploadCode,
  deleteIOSUploadCode,
} from "@/api/admin/users"
import type { AdminUserDetail, UserActivity, AdminGameAccountBinding, AuthorizedSocialPlatform, UserSocialPlatform } from "@/types/admin"

const props = defineProps<{ userId: string }>()
const router = useRouter()
const userStore = useUserStore()

const GAME_SERVERS: Record<string, string> = {
  jp: "日服 (JP)",
  en: "国际服 (EN)",
  tw: "台服 (TW)",
  kr: "韩服 (KR)",
  cn: "国服 (CN)",
}

const SOCIAL_PLATFORMS: Record<string, { label: string, icon: any }> = {
  qq: { label: "QQ", icon: LucideMessageCircle },
  qqbot: { label: "QQ官方Bot", icon: LucideBot },
  discord: { label: "Discord", icon: LucideMonitor },
  telegram: { label: "Telegram", icon: LucideSend },
}

const loading = ref(true)
const actionLoading = ref(false)
const user = ref<AdminUserDetail | null>(null)

// Activity
const activities = ref<UserActivity[]>([])
const activityLoading = ref(false)

// OAuth
const oauthAuths = ref<unknown[]>([])
const oauthLoading = ref(false)

// Game bindings
const gameBindings = ref<AdminGameAccountBinding[]>([])
const gameBindingLoading = ref(false)

// Social platform
const socialPlatform = ref<UserSocialPlatform | null>(null)
const socialLoading = ref(false)

// Authorized social platforms
const authorizedSocials = ref<AuthorizedSocialPlatform[]>([])
const authSocialLoading = ref(false)

// iOS upload code
const iosUploadCode = ref<string | null>(null)

// Email edit
const emailDialogOpen = ref(false)
const editEmail = ref("")

// Game binding add/edit
const gameBindingDialogOpen = ref(false)
const editGameServer = ref("jp")
const editGameUserId = ref("")
const editGameSuite = ref({
  allowPublicApi: false,
  allowSakura: false,
  allow8823: false,
  allowResona: false,
  allowLuna: false,
})
const editGameMysekai = ref({
  allowPublicApi: false,
  allowFixtureApi: false,
  allow8823: false,
  allowResona: false,
  allowLuna: false,
})

// Social platform edit
const socialDialogOpen = ref(false)
const editSocialPlatform = ref("")
const editSocialUserId = ref("")
const editSocialVerified = ref(false)

// Authorized social platform add/edit
const authSocialDialogOpen = ref(false)
const editAuthSocialId = ref("")
const editAuthSocialPlatform = ref("qq")
const editAuthSocialUserId = ref("")
const editAuthSocialComment = ref("")

async function loadUser() {
  loading.value = true
  try {
    user.value = await getUserDetail(props.userId)
    // populate iosUploadCode from user detail
    if (user.value?.userData?.iosUploadCode) {
      iosUploadCode.value = user.value.userData.iosUploadCode
    }
  } catch (e: unknown) {
    const err = e as Error
    toast.error("加载用户详情失败", { description: err.message })
  } finally {
    loading.value = false
  }
}

async function loadActivities() {
  activityLoading.value = true
  try {
    const res = await getUserActivity(props.userId)
    activities.value = res.systemLogs ?? []
  } catch (e: unknown) {
    const err = e as Error
    toast.error("加载活动记录失败", { description: err.message })
  } finally {
    activityLoading.value = false
  }
}

async function loadOAuth() {
  oauthLoading.value = true
  try {
    oauthAuths.value = await getUserOAuthAuthorizations(props.userId) as unknown[]
  } catch (e: unknown) {
    const err = e as Error
    toast.error("加载OAuth授权失败", { description: err.message })
  } finally {
    oauthLoading.value = false
  }
}

async function loadGameBindings() {
  gameBindingLoading.value = true
  try {
    gameBindings.value = await getGameAccountBindings(props.userId)
  } catch (e: unknown) {
    const err = e as Error
    toast.error("加载游戏绑定失败", { description: err.message })
  } finally {
    gameBindingLoading.value = false
  }
}

async function loadSocialPlatform() {
  socialLoading.value = true
  try {
    socialPlatform.value = await getSocialPlatform(props.userId)
  } catch {
    socialPlatform.value = null
  } finally {
    socialLoading.value = false
  }
}

async function loadAuthorizedSocials() {
  authSocialLoading.value = true
  try {
    authorizedSocials.value = await getAuthorizedSocialPlatforms(props.userId)
  } catch {
    authorizedSocials.value = []
  } finally {
    authSocialLoading.value = false
  }
}

onMounted(loadUser)

function onTabChange(tab: string | number) {
  const val = String(tab)
  if (val === "activity" && activities.value.length === 0) loadActivities()
  if (val === "oauth" && oauthAuths.value.length === 0) loadOAuth()
  if (val === "game" && gameBindings.value.length === 0) loadGameBindings()
  if (val === "social" && !socialPlatform.value) loadSocialPlatform()
  if (val === "auth-social" && authorizedSocials.value.length === 0) loadAuthorizedSocials()
}

// ===== 操作 =====

async function handleBan() {
  actionLoading.value = true
  try {
    await banUser(props.userId)
    toast.success("已封禁用户")
    await loadUser()
  } catch (e: unknown) {
    toast.error("封禁失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleUnban() {
  actionLoading.value = true
  try {
    await unbanUser(props.userId)
    toast.success("已解封用户")
    await loadUser()
  } catch (e: unknown) {
    toast.error("解封失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleForceLogout() {
  actionLoading.value = true
  try {
    await forceLogout(props.userId)
    toast.success("已强制登出")
  } catch (e: unknown) {
    toast.error("强制登出失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleDelete() {
  actionLoading.value = true
  try {
    await deleteUser(props.userId)
    toast.success("已软删除用户")
    await loadUser()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleRestore() {
  actionLoading.value = true
  try {
    await restoreUser(props.userId)
    toast.success("已恢复用户")
    await loadUser()
  } catch (e: unknown) {
    toast.error("恢复失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleResetPassword() {
  actionLoading.value = true
  try {
    await resetPassword(props.userId)
    toast.success("已重置密码")
  } catch (e: unknown) {
    toast.error("重置密码失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

async function handleRoleChange(val: unknown) {
  if (!val) return
  const roleStr = String(val)
  actionLoading.value = true
  try {
    await updateUserRole(props.userId, roleStr)
    toast.success(`已更新角色为 ${roleStr}`)
    await loadUser()
  } catch (e: unknown) {
    toast.error("更新角色失败", { description: (e as Error).message })
  } finally { actionLoading.value = false }
}

function openEmailEdit() {
  if (!user.value) return
  editEmail.value = user.value?.userData.emailInfo?.email || ""
  emailDialogOpen.value = true
}

async function handleEmailUpdate() {
  if (!editEmail.value.trim()) return
  actionLoading.value = true
  try {
    await updateUserEmail(props.userId, editEmail.value.trim())
    toast.success("邮箱已更新")
    emailDialogOpen.value = false
    await loadUser()
  } catch (e: unknown) {
    toast.error("更新邮箱失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleRevokeOAuth() {
  try {
    await revokeUserOAuth(props.userId)
    toast.success("已撤销OAuth授权")
    await loadOAuth()
  } catch (e: unknown) {
    toast.error("撤销失败", { description: (e as Error).message })
  }
}

async function handleDeleteGameBinding(server: string, gameUserId: string) {
  try {
    await deleteGameAccountBinding(props.userId, server, gameUserId)
    toast.success("已删除游戏绑定")
    await loadGameBindings()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

async function handleToggleCNMysekai(val: boolean | 'indeterminate') {
  if (!user.value || val === 'indeterminate') return
  try {
    await updateAllowCNMysekai(props.userId, val)
    user.value.userData.allowCNMysekai = val
    toast.success(val ? "已开启国服 MySekai" : "已关闭国服 MySekai")
  } catch (e: unknown) {
    toast.error("更新失败", { description: (e as Error).message })
  }
}

function openAddGameBinding() {
  editGameServer.value = "jp"
  editGameUserId.value = ""
  editGameSuite.value = { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false }
  editGameMysekai.value = { allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false, allowLuna: false }
  gameBindingDialogOpen.value = true
}

function openEditGameBinding(b: { server: string; gameUserId: string; suite?: unknown; mysekai?: unknown }) {
  editGameServer.value = b.server
  editGameUserId.value = b.gameUserId
  // Handle both boolean and object suite/mysekai from backend
  const s = b.suite
  editGameSuite.value = (s && typeof s === 'object')
    ? { allowPublicApi: !!(s as any).allowPublicApi, allowSakura: !!(s as any).allowSakura, allow8823: !!(s as any).allow8823, allowResona: !!(s as any).allowResona, allowLuna: !!(s as any).allowLuna }
    : { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false }
  const m = b.mysekai
  editGameMysekai.value = (m && typeof m === 'object')
    ? { allowPublicApi: !!(m as any).allowPublicApi, allowFixtureApi: !!(m as any).allowFixtureApi, allow8823: !!(m as any).allow8823, allowResona: !!(m as any).allowResona, allowLuna: !!(m as any).allowLuna }
    : { allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false, allowLuna: false }
  gameBindingDialogOpen.value = true
}

async function handleSaveGameBinding() {
  if (!editGameUserId.value.trim()) return
  actionLoading.value = true
  try {
    await updateGameAccountBinding(
      props.userId,
      editGameServer.value,
      editGameUserId.value.trim(),
      { suite: editGameSuite.value, mysekai: editGameMysekai.value }
    )
    toast.success("游戏绑定已保存")
    gameBindingDialogOpen.value = false
    await loadGameBindings()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteSocial() {
  try {
    await deleteSocialPlatform(props.userId)
    toast.success("已删除社交平台绑定")
    socialPlatform.value = null
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

function openEditSocial() {
  editSocialPlatform.value = socialPlatform.value?.platform || "qq"
  editSocialUserId.value = socialPlatform.value?.userId || ""
  editSocialVerified.value = socialPlatform.value?.verified || false
  socialDialogOpen.value = true
}

async function handleSaveSocial() {
  if (!editSocialPlatform.value.trim() || !editSocialUserId.value.trim()) return
  actionLoading.value = true
  try {
    await updateSocialPlatform(props.userId, {
      platform: editSocialPlatform.value.trim(),
      userId: editSocialUserId.value.trim(),
      verified: editSocialVerified.value,
    })
    toast.success("社交平台信息已更新")
    socialDialogOpen.value = false
    // Optimistically update local state
    socialPlatform.value = {
      platform: editSocialPlatform.value.trim(),
      userId: editSocialUserId.value.trim(),
      verified: editSocialVerified.value,
    }
    await loadSocialPlatform()
  } catch (e: unknown) {
    toast.error("更新失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteAuthSocial(platformId: string) {
  try {
    await deleteAuthorizedSocialPlatform(props.userId, platformId)
    toast.success("已删除授权社交平台")
    await loadAuthorizedSocials()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

function openAddAuthSocial() {
  const list = Array.isArray(authorizedSocials.value) ? authorizedSocials.value : []
  const existingIds = list.map(s => Number(s.id))
  let nextId = 1
  while (existingIds.includes(nextId)) nextId++
  editAuthSocialId.value = String(nextId)
  editAuthSocialPlatform.value = "qq"
  editAuthSocialUserId.value = ""
  editAuthSocialComment.value = ""
  authSocialDialogOpen.value = true
}

function openEditAuthSocial(s: { id: string; platform: string; userId: string; comment?: string }) {
  editAuthSocialId.value = s.id
  editAuthSocialPlatform.value = s.platform || "qq"
  editAuthSocialUserId.value = s.userId || ""
  editAuthSocialComment.value = s.comment || ""
  authSocialDialogOpen.value = true
}

async function handleSaveAuthSocial() {
  if (!editAuthSocialUserId.value.trim()) return
  actionLoading.value = true
  try {
    await updateAuthorizedSocialPlatform(props.userId, editAuthSocialId.value, {
      platform: editAuthSocialPlatform.value,
      userId: editAuthSocialUserId.value.trim(),
      comment: editAuthSocialComment.value.trim(),
    })
    toast.success("授权社交平台已保存")
    authSocialDialogOpen.value = false
    await loadAuthorizedSocials()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleRegenerateIOS() {
  try {
    const res = await regenerateIOSUploadCode(props.userId)
    if (res?.uploadCode) {
      iosUploadCode.value = res.uploadCode
    }
    toast.success("已重新生成iOS上传码")
  } catch (e: unknown) {
    toast.error("生成失败", { description: (e as Error).message })
  }
}

async function handleDeleteIOS() {
  try {
    await deleteIOSUploadCode(props.userId)
    iosUploadCode.value = null
    toast.success("已删除iOS上传码")
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

function roleLabel(r: string) {
  switch (r) {
    case "super_admin": return "超级管理员"
    case "admin": return "管理员"
    default: return "用户"
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("zh-CN")
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 返回 -->
    <Button variant="ghost" size="sm" class="self-start" @click="router.push('/admin/users')">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> 返回用户列表
    </Button>

    <template v-if="loading">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="user">
      <Tabs default-value="info" @update:model-value="onTabChange">
        <TabsList class="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="activity">活动记录</TabsTrigger>
          <TabsTrigger value="oauth">OAuth授权</TabsTrigger>
          <TabsTrigger value="game">游戏绑定</TabsTrigger>
          <TabsTrigger value="social">社交平台</TabsTrigger>
          <TabsTrigger value="auth-social">授权社交</TabsTrigger>
          <TabsTrigger value="ios">iOS上传码</TabsTrigger>
        </TabsList>

        <!-- 基本信息 -->
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>{{ user.userData.name }}</CardTitle>
              <CardDescription>ID: {{ user.userData.userId }}</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-6">
              <!-- 用户状态概览 -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
                  <span class="text-muted-foreground text-xs mb-1">角色</span>
                  <div class="font-semibold text-base flex items-center gap-1.5">
                    <span :class="[
                      user.userData.role === 'super_admin' ? 'text-red-500' :
                      user.userData.role === 'admin' ? 'text-blue-500' :
                      'text-muted-foreground'
                    ]">
                      <LucideShieldAlert v-if="user.userData.role === 'super_admin'" class="w-4 h-4" />
                      <LucideShield v-else-if="user.userData.role === 'admin'" class="w-4 h-4" />
                      <LucideUser v-else class="w-4 h-4" />
                    </span>
                    {{ roleLabel(user.userData.role) }}
                  </div>
                </div>
                <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
                  <span class="text-muted-foreground text-xs mb-1">账号状态</span>
                  <div class="font-semibold text-base">
                    <span :class="user.banned ? 'text-red-500 flex items-center gap-1.5' : 'text-green-500 flex items-center gap-1.5'">
                      <LucideBan v-if="user.banned" class="w-4 h-4" />
                      <LucideCheckCircle2 v-else class="w-4 h-4" />
                      {{ user.banned ? '已封禁' : '正常' }}
                    </span>
                  </div>
                </div>
                <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-muted-foreground text-xs">邮箱</span>
                    <Button variant="ghost" size="sm" class="h-5 px-1.5 text-[10px]" @click="openEmailEdit">
                      <LucidePencil class="w-3 h-3" />
                    </Button>
                  </div>
                  <div class="font-medium text-sm truncate" :title="user.userData.emailInfo?.email || '未绑定'">
                    {{ user.userData.emailInfo?.email || '未绑定' }}
                  </div>
                </div>
                <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
                  <span class="text-muted-foreground text-xs mb-1">注册时间</span>
                  <div class="font-medium text-sm text-muted-foreground">开发中...</div>
                </div>
              </div>

              <!-- 角色管理（仅 super_admin） -->
              <div v-if="userStore.isSuperAdmin" class="flex items-center gap-3">
                <Label>修改角色：</Label>
                <Select :model-value="user.userData.role" @update:model-value="handleRoleChange">
                  <SelectTrigger class="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div class="flex items-center gap-2">
                        <LucideUser class="w-4 h-4 text-muted-foreground" />
                        用户
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div class="flex items-center gap-2">
                        <LucideShield class="w-4 h-4 text-blue-500" />
                        管理员
                      </div>
                    </SelectItem>
                    <SelectItem value="super_admin">
                      <div class="flex items-center gap-2">
                        <LucideShieldAlert class="w-4 h-4 text-red-500" />
                        超级管理员
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 国服MySekai开关 -->
              <div class="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border w-fit">
                <Checkbox
                  id="allowCNMysekai"
                  :model-value="user.userData.allowCNMysekai ?? false"
                  @update:model-value="handleToggleCNMysekai"
                />
                <Label for="allowCNMysekai" class="text-sm font-medium cursor-pointer">允许使用国服 MySekai 功能</Label>
              </div>

              <!-- 操作按钮 -->
              <div class="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t text-sm text-muted-foreground">
                <template v-if="user.banned">
                  <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleUnban">
                    <LucideShieldOff class="w-4 h-4 mr-1" /> 解封
                  </Button>
                </template>
                <template v-else>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button variant="destructive" size="sm" :disabled="actionLoading">
                        <LucideBan class="w-4 h-4 mr-1" /> 封禁
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认封禁</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要封禁用户 {{ user.userData.name }} 吗？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction @click="handleBan">确认</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </template>

                <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleForceLogout">
                  <LucideLogOut class="w-4 h-4 mr-1" /> 强制登出
                </Button>
                <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleResetPassword">
                  <LucideRefreshCw class="w-4 h-4 mr-1" /> 重置密码
                </Button>

                <template v-if="false">
                  <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleRestore">
                    <LucideUndo2 class="w-4 h-4 mr-1" /> 恢复
                  </Button>
                </template>
                <template v-else>
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Button variant="destructive" size="sm" :disabled="actionLoading">
                        <LucideTrash2 class="w-4 h-4 mr-1" /> 删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作是软删除，可以恢复。确定要删除用户 {{ user.userData.name }} 吗？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction @click="handleDelete">确认删除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </template>

                <LucideLoader2 v-if="actionLoading" class="w-4 h-4 animate-spin self-center" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 活动记录 -->
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>活动记录</CardTitle>
            </CardHeader>
            <CardContent>
              <template v-if="activityLoading">
                <Skeleton v-for="i in 3" :key="i" class="h-10 w-full mb-2" />
              </template>
              <template v-else-if="activities.length > 0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>操作</TableHead>
                      <TableHead>结果</TableHead>
                      <TableHead class="hidden sm:table-cell">路径</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="a in activities" :key="a.id">
                      <TableCell class="font-medium text-sm">{{ a.action }}</TableCell>
                      <TableCell>
                        <span :class="[
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                          a.result === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        ]">
                          <LucideCheckCircle2 v-if="a.result === 'success'" class="w-3.5 h-3.5" />
                          <LucideXCircle v-else class="w-3.5 h-3.5" />
                          {{ a.result === 'success' ? '成功' : '失败' }}
                        </span>
                      </TableCell>
                      <TableCell class="hidden sm:table-cell text-muted-foreground text-sm">{{ a.path || '—' }}</TableCell>
                      <TableCell class="text-sm text-muted-foreground whitespace-nowrap">{{ formatDate(a.eventTime) }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </template>
              <template v-else>
                <p class="text-center text-muted-foreground py-8">暂无活动记录</p>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- OAuth授权 -->
        <TabsContent value="oauth">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle>OAuth授权</CardTitle>
              <Button v-if="(oauthAuths as unknown[]).length > 0" variant="destructive" size="sm" @click="handleRevokeOAuth">
                撤销全部
              </Button>
            </CardHeader>
            <CardContent>
              <template v-if="oauthLoading">
                <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
              </template>
              <template v-else-if="(oauthAuths as unknown[]).length > 0">
                <div class="text-sm text-muted-foreground">
                  共 {{ (oauthAuths as unknown[]).length }} 个授权
                </div>
              </template>
              <template v-else>
                <p class="text-center text-muted-foreground py-8">暂无OAuth授权</p>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 游戏绑定 -->
        <TabsContent value="game">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle>游戏账号绑定</CardTitle>
              <Button variant="outline" size="sm" @click="openAddGameBinding">
                + 添加绑定
              </Button>
            </CardHeader>
            <CardContent>
              <template v-if="gameBindingLoading">
                <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
              </template>
              <template v-else-if="gameBindings.length > 0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>服务器</TableHead>
                      <TableHead>游戏ID</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="b in gameBindings" :key="`${b.server}-${b.gameUserId}`">
                      <TableCell class="uppercase font-semibold text-primary">{{ GAME_SERVERS[b.server] || b.server }}</TableCell>
                      <TableCell class="font-mono text-xs">{{ b.gameUserId }}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger as-child>
                            <Button variant="ghost" class="h-8 w-8 p-0">
                              <span class="sr-only">打开菜单</span>
                              <LucideMoreHorizontal class="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem @click="openEditGameBinding(b)">
                              <LucidePencil class="w-4 h-4 mr-2" />
                              编辑游戏绑定
                            </DropdownMenuItem>
                            <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleDeleteGameBinding(b.server, b.gameUserId)">
                              <LucideTrash2 class="w-4 h-4 mr-2" />
                              解绑游戏账号
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </template>
              <template v-else>
                <p class="text-center text-muted-foreground py-8">暂无游戏绑定</p>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 社交平台 -->
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>社交平台绑定</CardTitle>
            </CardHeader>
            <CardContent>
              <template v-if="socialLoading">
                <Skeleton class="h-20 w-full" />
              </template>
              <template v-else-if="socialPlatform">
                <div class="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <component :is="SOCIAL_PLATFORMS[socialPlatform.platform]?.icon || LucideGlobe" class="w-6 h-6" />
                    </div>
                    <div>
                      <div class="font-semibold text-base">{{ SOCIAL_PLATFORMS[socialPlatform.platform]?.label || socialPlatform.platform }}</div>
                      <div class="text-sm text-muted-foreground font-mono mt-0.5">ID: {{ socialPlatform.userId }}</div>
                      <div class="mt-1.5">
                        <span :class="[
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                          socialPlatform.verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        ]">
                          <LucideCheckCircle2 v-if="socialPlatform.verified" class="w-3 h-3" />
                          {{ socialPlatform.verified ? '已验证' : '未验证' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="sm" @click="openEditSocial">编辑</Button>
                    <Button variant="ghost" size="sm" class="text-destructive" @click="handleDeleteSocial">
                      <LucideTrash2 class="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="flex flex-col items-center gap-3 py-8">
                  <p class="text-muted-foreground">暂无社交平台绑定</p>
                  <Button variant="outline" size="sm" @click="openEditSocial">添加绑定</Button>
                </div>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 授权社交平台 -->
        <TabsContent value="auth-social">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between">
              <CardTitle>授权社交平台</CardTitle>
              <Button variant="outline" size="sm" @click="openAddAuthSocial">
                + 添加授权
              </Button>
            </CardHeader>
            <CardContent>
              <template v-if="authSocialLoading">
                <Skeleton v-for="i in 2" :key="i" class="h-10 w-full mb-2" />
              </template>
              <template v-else-if="authorizedSocials.length > 0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>平台</TableHead>
                      <TableHead>用户ID</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="s in authorizedSocials" :key="s.id">
                      <TableCell class="font-medium">
                        <div class="flex items-center gap-2">
                          <component :is="SOCIAL_PLATFORMS[s.platform]?.icon || LucideGlobe" class="w-4 h-4 text-muted-foreground" />
                          {{ SOCIAL_PLATFORMS[s.platform]?.label || s.platform }}
                        </div>
                      </TableCell>
                      <TableCell>{{ s.userId }}</TableCell>
                      <TableCell class="text-muted-foreground">{{ s.comment || '—' }}</TableCell>
                      <TableCell>
                        <div class="flex gap-1">
                          <Button variant="ghost" size="sm" @click="openEditAuthSocial(s)">编辑</Button>
                          <Button variant="ghost" size="sm" class="text-destructive" @click="handleDeleteAuthSocial(s.id)">
                            <LucideTrash2 class="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </template>
              <template v-else>
                <div class="flex flex-col items-center gap-3 py-8">
                  <p class="text-muted-foreground">暂无授权社交平台</p>
                  <Button variant="outline" size="sm" @click="openAddAuthSocial">添加授权</Button>
                </div>
              </template>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- iOS上传码 -->
        <TabsContent value="ios">
          <Card>
            <CardHeader>
              <CardTitle>iOS上传码</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="iosUploadCode" class="flex items-center justify-between p-4 border rounded-lg">
                <code class="text-sm font-mono bg-muted px-2 py-1 rounded">{{ iosUploadCode }}</code>
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" @click="handleRegenerateIOS">
                    <LucideRefreshCw class="w-4 h-4 mr-1" /> 重新生成
                  </Button>
                  <Button variant="ghost" size="sm" class="text-destructive" @click="handleDeleteIOS">
                    <LucideTrash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div v-else class="flex flex-col items-center gap-3 py-8">
                <p class="text-muted-foreground">暂无上传码</p>
                <Button variant="outline" size="sm" @click="handleRegenerateIOS">
                  <LucideRefreshCw class="w-4 h-4 mr-1" /> 生成上传码
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </template>

    <template v-else>
      <Card>
        <CardContent class="py-16 text-center text-muted-foreground">
          用户不存在或加载失败
        </CardContent>
      </Card>
    </template>
    <!-- 邮箱编辑对话框 -->
    <Dialog v-model:open="emailDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改邮箱</DialogTitle>
          <DialogDescription>
            修改用户 {{ user?.userData.name }} 的邮箱地址。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>新邮箱地址</Label>
            <Input v-model="editEmail" placeholder="user@example.com" type="email" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="emailDialogOpen = false">取消</Button>
          <Button @click="handleEmailUpdate" :disabled="!editEmail.trim() || actionLoading">
            确认修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 游戏绑定对话框 -->
    <Dialog v-model:open="gameBindingDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加游戏绑定</DialogTitle>
          <DialogDescription>
            为用户 {{ user?.userData.name }} 添加或更新游戏账号绑定。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>服务器</Label>
            <Select v-model="editGameServer">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(label, key) in GAME_SERVERS" :key="key" :value="String(key)">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>游戏用户ID</Label>
            <Input v-model="editGameUserId" placeholder="输入游戏内用户ID" />
          </div>
          <!-- Suite 设置 -->
          <div class="border rounded-lg p-3">
            <Label class="font-semibold text-sm">Suite 数据设置</Label>
            <div class="grid gap-2 mt-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">允许公开API访问</span>
                <Switch :model-value="editGameSuite.allowPublicApi" @update:model-value="v => editGameSuite.allowPublicApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至SakuraBot</span>
                <Switch :model-value="editGameSuite.allowSakura" @update:model-value="v => editGameSuite.allowSakura = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至烤森Bot</span>
                <Switch :model-value="editGameSuite.allow8823" @update:model-value="v => editGameSuite.allow8823 = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至ResonaBot</span>
                <Switch :model-value="editGameSuite.allowResona" @update:model-value="v => editGameSuite.allowResona = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至LunaBot</span>
                <Switch :model-value="editGameSuite.allowLuna" @update:model-value="v => editGameSuite.allowLuna = v" />
              </div>
            </div>
          </div>
          <!-- MySekai 设置 -->
          <div class="border rounded-lg p-3">
            <Label class="font-semibold text-sm">MySekai 数据设置</Label>
            <div class="grid gap-2 mt-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">允许公开API访问</span>
                <Switch :model-value="editGameMysekai.allowPublicApi" @update:model-value="v => editGameMysekai.allowPublicApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许家具共享API</span>
                <Switch :model-value="editGameMysekai.allowFixtureApi" @update:model-value="v => editGameMysekai.allowFixtureApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至烤森Bot</span>
                <Switch :model-value="editGameMysekai.allow8823" @update:model-value="v => editGameMysekai.allow8823 = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至ResonaBot</span>
                <Switch :model-value="editGameMysekai.allowResona" @update:model-value="v => editGameMysekai.allowResona = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至LunaBot</span>
                <Switch :model-value="editGameMysekai.allowLuna" @update:model-value="v => editGameMysekai.allowLuna = v" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="gameBindingDialogOpen = false">取消</Button>
          <Button @click="handleSaveGameBinding" :disabled="!editGameUserId.trim() || actionLoading">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 社交平台对话框 -->
    <Dialog v-model:open="socialDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ socialPlatform ? '编辑' : '添加' }}社交平台绑定</DialogTitle>
          <DialogDescription>
            管理用户 {{ user?.userData.name }} 的社交平台主绑定信息。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>平台</Label>
            <Select v-model="editSocialPlatform">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(v, k) in SOCIAL_PLATFORMS" :key="k" :value="String(k)">
                  <div class="flex items-center gap-2">
                    <component :is="v.icon" class="w-4 h-4" />
                    {{ v.label }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>用户ID</Label>
            <Input v-model="editSocialUserId" placeholder="平台上的用户ID" />
          </div>
          <div class="flex items-center gap-2">
            <Checkbox id="socialVerified" :model-value="editSocialVerified" @update:model-value="(v: boolean | 'indeterminate') => editSocialVerified = !!v" />
            <Label for="socialVerified" class="text-sm font-normal">已验证</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="socialDialogOpen = false">取消</Button>
          <Button @click="handleSaveSocial" :disabled="!editSocialPlatform.trim() || !editSocialUserId.trim() || actionLoading">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 授权社交平台对话框 -->
    <Dialog v-model:open="authSocialDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editAuthSocialId ? '编辑' : '添加' }}授权社交平台</DialogTitle>
          <DialogDescription>
            管理用户 {{ user?.userData.name }} 的授权社交平台账号。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>平台</Label>
            <Select v-model="editAuthSocialPlatform">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="(v, k) in SOCIAL_PLATFORMS" :key="k" :value="String(k)">
                  <div class="flex items-center gap-2">
                    <component :is="v.icon" class="w-4 h-4" />
                    {{ v.label }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>用户ID</Label>
            <Input v-model="editAuthSocialUserId" placeholder="平台上的用户ID" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>备注</Label>
            <Input v-model="editAuthSocialComment" placeholder="备注（可选）" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="authSocialDialogOpen = false">取消</Button>
          <Button @click="handleSaveAuthSocial" :disabled="!editAuthSocialUserId.trim() || actionLoading">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
