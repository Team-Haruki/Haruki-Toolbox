<script setup lang='ts'>
import { ref, computed } from 'vue'
import {toast} from "vue-sonner"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Progress} from "@/components/ui/progress"

import { submitInherit, uploadManualData } from "@/components/users/data/api"
import { useUserStore } from "@/components/users/data/store"
import type { SekaiRegion } from "@/components/users/data/types"

import {
  Card,
  CardTitle,
  CardFooter,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Input,
  InputWithToggle
} from "@/components/ui/input"
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select"

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  LucideInfo,
  LucideFileKey,
  LucideShieldAlert,
  LucideAlertTriangle
} from "lucide-vue-next";

const dataType = ref("suite");
const selectedFile = ref<File | null>(null)
const inheritServer = ref("jp");
const inheritId = ref("");
const inheritPassword = ref("");
const isSubmittingFile = ref(false);
const isSubmittingInherit = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const boundAccounts = computed(() => {
  const raw = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  const nameMap: Record<string, string> = { jp: '日服', en: '国际服', tw: '台服', kr: '韩服', cn: '国服' }
  return raw.map(acc => {
    const server = String((acc as any).server)
    const uid = String((acc as any).userId)
    return {
      key: `${server}:${uid}`,
      server,
      uid,
      label: `${nameMap[server] ?? server} / UID ${uid}`,
    }
  })
})

const selectedAccountKey = ref<string | null>(null)
const selectedAccount = computed(() => {
  if (!selectedAccountKey.value) return null
  const [server, uid] = selectedAccountKey.value.split(":")
  return { server, uid }
})

const disabledReason = computed(() => {
  if (!isLoggedIn.value) return '请先登录再使用此功能'
  if ((boundAccounts.value?.length ?? 0) === 0) return '您还没有绑定任何账号，请先绑定账号'
  return null
})

const isCNMySekaiForbidden = computed(() => {
  return (
    selectedAccount.value?.server === 'cn' &&
    userStore.allowCNMysekai === false &&
    dataType.value === 'mysekai'
  )
})

const savedInherit = localStorage.getItem("haruki_inherit");
if (savedInherit) {
  try {
    const parsed = JSON.parse(savedInherit);
    inheritId.value = parsed.inherit_id || "";
    inheritPassword.value = parsed.inherit_password || "";
    inheritServer.value = parsed.server || "jp";
    dataType.value = parsed.type || "suite";
  } catch (e) {
    console.error("Failed to parse saved inherit info", e);
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
}

async function submitFileUpload() {
  if (disabledReason.value) {
    toast.warning(disabledReason.value)
    return
  }
  if (!selectedAccount.value) {
    toast.warning('请选择一个账号')
    return
  }
  const file = selectedFile.value
  if (!file) {
    toast.warning('请选择一个文件')
    return
  }
  if (isCNMySekaiForbidden.value) {
    toast.error('提交被禁止', { description: '由于相关法律法规限制，不允许进行此操作' })
    return
  }
  isSubmittingFile.value = true
  uploadProgress.value = 0
  uploadStatus.value = `正在上传您的${dataType.value === 'suite' ? 'Suite' : 'MySekai'}数据...`
  try {
    const resp = await uploadManualData(
      selectedAccount.value.server!,
      String(selectedAccount.value.uid),
      dataType.value,
      file,
      (p) => (uploadProgress.value = p)
    )
    uploadStatus.value = '上传成功'
    toast.success('上传成功', { description: resp?.message || '文件已上传' })
  } catch (e: any) {
    console.error(e)
    uploadStatus.value = '上传失败'
    const desc = e?.response?.data?.message || e?.message
    toast.error('上传失败', { description: desc })
  } finally {
    isSubmittingFile.value = false
  }
}

async function submitInheritUpload() {
  if (!inheritId.value || !inheritPassword.value) {
    toast.warning("请填写完整的继承信息", {
      description: "继承ID和继承密码均为必填项",
    });
    return;
  }
  isSubmittingInherit.value = true;
  try {
    const response = await submitInherit(
      inheritServer.value as SekaiRegion,
      dataType.value,
      inheritId.value.trim(),
      inheritPassword.value.trim(),
    );
    toast.success("上传成功", {
      description: response?.message || "继承码已上传",
    });
    localStorage.setItem("haruki_inherit", JSON.stringify({
      inherit_id: inheritId.value,
      inherit_password: inheritPassword.value,
      server: inheritServer.value,
      type: dataType.value,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error(e);
    toast.error("上传失败", {
      description: (e as any)?.response?.data?.message || (e as any)?.message,
    });
  } finally {
    isSubmittingInherit.value = false;
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Tabs default-value="inherit" class="max-w-md">
      <Alert variant="default" class="flex items-start gap-2">
        <LucideInfo class="h-4 w-4"/>
        <div>
          <AlertDescription>Haruki主群: 730020933</AlertDescription>
        </div>
      </Alert>
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="file">文件上传</TabsTrigger>
        <TabsTrigger value="inherit">继承码上传</TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        <Card class="dark:green">
          <CardHeader>
            <CardTitle>手动上传文件</CardTitle>
            <CardDescription>此选项可以手动上传你捕获的数据</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert v-if="disabledReason" variant="destructive" class="mb-3">
              <LucideAlertTriangle class="h-5 w-5" />
              <AlertTitle>无法使用</AlertTitle>
              <AlertDescription>{{ disabledReason }}</AlertDescription>
            </Alert>
            <Alert v-else-if="isCNMySekaiForbidden" variant="destructive" class="mb-3">
              <LucideShieldAlert class="h-5 w-5" />
              <AlertTitle>操作已被禁止</AlertTitle>
              <AlertDescription>由于相关法律法规限制，不允许进行此操作</AlertDescription>
            </Alert>
            <form>
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label for="file-upload">上传文件</Label>
                  <Input id="file-upload" type="file" class="w-full" @change="onFileChange" :disabled="!!disabledReason"/>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="account-select">选择账号（区服 / UID）</Label>
                  <Select id="account-select" v-model="selectedAccountKey" :disabled="!!disabledReason">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="请选择已绑定的账号" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="acc in boundAccounts" :key="acc.key" :value="acc.key">
                        {{ acc.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="data-type-select">选择数据类型</Label>
                  <Select id="data-type-select" v-model="dataType" :disabled="!!disabledReason">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="请选择数据类型"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="mysekai">MySekai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter class="flex items-center justify-end">
            <Button variant="default" :disabled="isSubmittingFile || !!disabledReason || isCNMySekaiForbidden" @click.prevent="submitFileUpload">
              {{ isSubmittingFile ? '提交中...' : '提交' }}
            </Button>
          </CardFooter>
          <div v-if="isSubmittingFile || uploadStatus" class="w-full px-6">
            <Progress :model-value="uploadProgress" class="w-full h-3 rounded"/>
            <div class="flex justify-between mt-2 text-sm font-medium">
              <span>{{ uploadStatus }}</span>
              <span v-if="isSubmittingFile">{{ uploadProgress }}%</span>
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="inherit">
        <Alert variant="destructive" class="mb-2 bg-red-200">
          <LucideAlertTriangle class="h-5 w-5"/>
          <AlertTitle class="text-red-600 dark:text-red-600">警告</AlertTitle>
          <AlertDescription class="text-red-600 dark:text-red-600">
            请妥善保存您的引继ID与密码！Haruki工具箱服务器不会保存您的引继ID与密码！
          </AlertDescription>
        </Alert>
        <Alert variant="destructive" class="mb-2 bg-amber-200">
          <LucideShieldAlert class="h-5 w-5"/>
          <AlertTitle class="text-red-600 dark:text-red-600">警告</AlertTitle>
          <AlertDescription class="text-red-600 dark:text-red-600">
            尽管开发者已经尽最大可能将 API 请求优化得尽可能像一个正常 app 请求，使用风险仍然需要自负。<br>
            如果你认为这个风险你负担不起，请不要使用本功能。
          </AlertDescription>
        </Alert>
        <Alert class="mb-2 bg-green-300">
          <LucideFileKey class="h-5 w-5"/>
          <AlertTitle class="dark:text-black">提醒</AlertTitle>
          <AlertDescription class="dark:text-black">
            您的引继信息会在提交成功后保存在浏览器本地，以防您丢失引继信息。<br>
            因此强烈建议您不要使用无痕模式，避免意外丢失引继信息。
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>继承码上传数据</CardTitle>
            <CardDescription>此选项可以提交你的继承码到Haruki工具箱后端捕获你需要的数据</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label for="inherit-id">继承ID</Label>
                  <Input id="inherit-id" placeholder="请输入继承ID" v-model="inheritId"/>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="inherit-password">继承密码</Label>
                  <InputWithToggle type="password" class="w-full" placeholder="请输入继承密码"
                                   v-model="inheritPassword"></InputWithToggle>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="inherit-server-select">选择区服</Label>
                  <Select id="inherit-server-select" v-model="inheritServer">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="请选择区服"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jp">日服</SelectItem>
                      <SelectItem value="en">国际服</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="inherit-data-type-select">选择数据类型</Label>
                  <Select id="inherit-data-type-select" v-model="dataType">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="请选择数据类型"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="mysekai">MySekai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter class="flex items-center justify-end">
            <Button :disabled="isSubmittingInherit" @click.prevent="submitInheritUpload">
              {{ isSubmittingInherit ? '提交中...' : '提交' }}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>