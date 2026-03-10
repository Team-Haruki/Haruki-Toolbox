<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideArrowLeft,
  LucideSend,
  LucideLoader2,
} from "lucide-vue-next"
import {
  ticketPriorityIcon,
  ticketPriorityTextClass,
} from "@/modules/tickets/lib/display"
import { useTicketCreate } from "@/modules/tickets/composables/useTicketCreate"

const { t } = useI18n()

const {
  subject,
  category,
  priority,
  message,
  submitting,
  categories,
  priorities,
  handleSubmit,
  goBackToTicketList,
} = useTicketCreate()
</script>

<template>
  <div class="w-full max-w-xl mx-auto flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="self-start" @click="goBackToTicketList">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("tickets.create.backButton") }}
    </Button>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("tickets.create.title") }}</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-5">
        <!-- Subject -->
        <div class="flex flex-col gap-2">
          <Label for="subject">{{ t("tickets.create.fields.subject") }}</Label>
          <Input id="subject" v-model="subject" :placeholder="t('tickets.create.fields.subjectPlaceholder')" />
        </div>

        <!-- Category and priority -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <Label>{{ t("tickets.create.fields.category") }}</Label>
            <Select v-model="category">
              <SelectTrigger class="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in categories" :key="c.value" :value="c.value">
                  {{ c.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-2">
            <Label>{{ t("tickets.create.fields.priority") }}</Label>
            <Select v-model="priority">
              <SelectTrigger class="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in priorities" :key="p.value" :value="p.value">
                  <div class="flex items-center gap-2 py-0.5">
                    <component :is="ticketPriorityIcon(p.value)" :class="['w-4 h-4', ticketPriorityTextClass(p.value)]" v-if="ticketPriorityIcon(p.value)" />
                    <span>{{ p.label }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-2">
          <Label for="message">{{ t("tickets.create.fields.message") }}</Label>
          <textarea
            id="message"
            v-model="message"
            :placeholder="t('tickets.create.fields.messagePlaceholder')"
            rows="6"
            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>

        <!-- Submit -->
        <Button @click="handleSubmit" :disabled="submitting" class="self-end">
          <LucideLoader2 v-if="submitting" class="w-4 h-4 mr-1 animate-spin" />
          <LucideSend v-else class="w-4 h-4 mr-1" />
          {{ submitting ? t("tickets.create.submitting") : t("tickets.create.submit") }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
