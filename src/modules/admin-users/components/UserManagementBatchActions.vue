<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideBan,
  LucideCheckCircle2,
  LucideLoader2,
  LucideLogOut,
  LucideSettings2,
  LucideShield,
  LucideShieldAlert,
  LucideShieldOff,
  LucideUser,
  LucideUserCog,
} from "lucide-vue-next"
import { roleLabel } from "@/modules/admin-users/constants"
import type { UserRole } from "@/types/common"

defineProps<{
  selectedCount: number
  batchLoading: boolean
  isSuperAdmin: boolean
  batchRoleTarget: UserRole
  batchAllowCnTarget: "true" | "false"
}>()

const emit = defineEmits<{
  (e: "update:batchRoleTarget", value: UserRole): void
  (e: "update:batchAllowCnTarget", value: "true" | "false"): void
  (e: "batchBan"): void
  (e: "batchUnban"): void
  (e: "batchForceLogout"): void
  (e: "batchRole"): void
  (e: "batchAllowCN"): void
}>()

const { t, locale } = useI18n()

const allowCNOpen = ref(false)

function confirmAllowCN() {
  allowCNOpen.value = false
  emit("batchAllowCN")
}
</script>

<template>
  <div v-if="selectedCount > 0" class="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t">
    <span class="text-sm text-muted-foreground mr-2">
      {{ t("adminUsers.management.batch.selectedCount", { count: selectedCount }) }}
    </span>

    <AlertDialog>
      <AlertDialogTrigger as-child>
        <Button variant="destructive" size="sm" :disabled="batchLoading">
          <LucideBan class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.banButton") }}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t("adminUsers.management.batch.banDialogTitle") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t("adminUsers.management.batch.banDialogDescription", { count: selectedCount }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
          <AlertDialogAction @click="emit('batchBan')">{{ t("adminUsers.management.batch.banDialogConfirm") }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Button variant="outline" size="sm" :disabled="batchLoading" @click="emit('batchUnban')">
      <LucideShieldOff class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.unbanButton") }}
    </Button>
    <AlertDialog>
      <AlertDialogTrigger as-child>
        <Button variant="outline" size="sm" :disabled="batchLoading">
          <LucideLogOut class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.forceLogoutButton") }}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t("adminUsers.management.batch.forceLogoutDialogTitle") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t("adminUsers.management.batch.forceLogoutDialogDescription", { count: selectedCount }) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
          <AlertDialogAction @click="emit('batchForceLogout')">{{ t("adminUsers.management.batch.forceLogoutDialogConfirm") }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Popover v-if="isSuperAdmin">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" :disabled="batchLoading">
          <LucideUserCog class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.roleButton") }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-64 p-4">
        <div class="space-y-4">
          <h4 class="font-medium leading-none mb-3">{{ t("adminUsers.management.batch.roleTitle") }}</h4>
          <Select :key="locale"
            :model-value="batchRoleTarget"
            @update:model-value="emit('update:batchRoleTarget', $event as UserRole)"
          >
            <SelectTrigger>
              <SelectValue :placeholder="t('adminUsers.management.batch.rolePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <div class="flex items-center gap-2">
                  <LucideUser class="w-4 h-4 text-muted-foreground" />
                  {{ t("adminUsers.role.user") }}
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div class="flex items-center gap-2">
                  <LucideShield class="w-4 h-4 text-blue-500" />
                  {{ t("adminUsers.role.admin") }}
                </div>
              </SelectItem>
              <SelectItem value="super_admin">
                <div class="flex items-center gap-2">
                  <LucideShieldAlert class="w-4 h-4 text-red-500" />
                  {{ t("adminUsers.role.superAdmin") }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="flex justify-end gap-2 mt-4">
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button size="sm">{{ t("adminUsers.management.batch.roleConfirm") }}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t("adminUsers.management.batch.roleDialogTitle") }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t("adminUsers.management.batch.roleDialogDescription", { count: selectedCount, role: roleLabel(batchRoleTarget, t) }) }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
                  <AlertDialogAction @click="emit('batchRole')">{{ t("adminUsers.management.batch.roleDialogConfirm") }}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <Popover v-model:open="allowCNOpen">
      <PopoverTrigger as-child>
        <Button variant="outline" size="sm" :disabled="batchLoading">
          <LucideSettings2 class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.allowCNButton") }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-64 p-4">
        <div class="space-y-4">
          <h4 class="font-medium leading-none mb-3">{{ t("adminUsers.management.batch.allowCNTitle") }}</h4>
          <Select :key="locale"
            :model-value="batchAllowCnTarget"
            @update:model-value="emit('update:batchAllowCnTarget', $event as 'true' | 'false')"
          >
            <SelectTrigger>
              <SelectValue :placeholder="t('adminUsers.management.batch.allowCNPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">
                <div class="flex items-center gap-2">
                  <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
                  {{ t("adminUsers.management.batch.allowCNEnable") }}
                </div>
              </SelectItem>
              <SelectItem value="false">
                <div class="flex items-center gap-2">
                  <LucideBan class="w-4 h-4 text-red-500" />
                  {{ t("adminUsers.management.batch.allowCNDisable") }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="flex justify-end gap-2 mt-4">
            <Button size="sm" @click="confirmAllowCN">{{ t("adminUsers.management.batch.allowCNConfirm") }}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>

    <LucideLoader2 v-if="batchLoading" class="w-4 h-4 animate-spin" />
  </div>
</template>
