<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { LucideLoader2, LucideSend } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import FieldError from "@/shared/components/FieldError.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { TICKET_MESSAGE_MAX_LENGTH, TICKET_SUBJECT_MAX_LENGTH, showsCharacterCount } from "@/modules/tickets/lib/ticket-draft"
import { TICKET_CREATE_FIELD_IDS, useTicketCreate } from "@/modules/tickets/composables/useTicketCreate"

const { t } = useI18n()

const {
  subject,
  category,
  priority,
  message,
  submitting,
  categories,
  priorities,
  fieldErrors,
  subjectLength,
  messageLength,
  messageGuide,
  handleFieldInput,
  handleFieldBlur,
  setCategory,
  setPriority,
  handleSubmit,
} = useTicketCreate()

const SUBJECT_ID = TICKET_CREATE_FIELD_IDS.subject
const MESSAGE_ID = TICKET_CREATE_FIELD_IDS.message
</script>

<template>
  <div class="@container mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 py-1 sm:py-2" data-testid="ticket-create">
    <PageHeader
      :title="t('tickets.create.title')" :description="t('tickets.create.description')"
      :back="{ name: 'tickets.list' }"
      :back-label="t('tickets.create.backButton')"
    />

    <!-- From 52rem: the form with the "before you submit" notes beside it. Below that the notes follow the form. -->
    <div class="grid items-start gap-4 @min-[52rem]:grid-cols-[minmax(0,1fr)_17rem]">
      <form class="min-w-0 divide-y divide-border/60 rounded-xl border bg-card" novalidate @submit.prevent="handleSubmit">
        <!-- What kind of issue: picks the guidance under the description below. -->
        <section class="grid gap-4 p-4">
          <h2 class="text-sm font-semibold">{{ t("tickets.create.typeTitle") }}</h2>
          <div class="grid gap-1.5">
            <p class="text-xs text-muted-foreground">{{ t("tickets.create.fields.category") }}</p>
            <ToggleGroup
              type="single"
              size="default"
              :model-value="category"
              :aria-label="t('tickets.create.fields.category')"
              data-testid="ticket-category"
              @update:model-value="setCategory"
            >
              <ToggleGroupItem v-for="option in categories" :key="option.value" :value="option.value" :data-value="option.value">
                {{ option.label }}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div class="grid gap-1.5">
            <p class="text-xs text-muted-foreground">{{ t("tickets.create.fields.priority") }}</p>
            <ToggleGroup
              type="single"
              variant="segment"
              size="default"
              class="w-fit max-w-full"
              :model-value="priority"
              :aria-label="t('tickets.create.fields.priority')"
              data-testid="ticket-priority"
              @update:model-value="setPriority"
            >
              <ToggleGroupItem v-for="option in priorities" :key="option.value" :value="option.value" :data-value="option.value" class="px-3.5">
                {{ option.label }}
              </ToggleGroupItem>
            </ToggleGroup>
            <p class="text-xs text-muted-foreground">{{ t("tickets.create.fields.priorityHint") }}</p>
          </div>
        </section>

        <!-- The issue itself. -->
        <section class="grid gap-4 p-4">
          <h2 class="text-sm font-semibold">{{ t("tickets.create.contentTitle") }}</h2>
          <div class="grid gap-1.5">
            <div class="flex items-baseline justify-between gap-3">
              <Label :for="SUBJECT_ID" class="text-xs font-normal text-muted-foreground">{{ t("tickets.create.fields.subject") }}</Label>
              <span
                :class="['text-[11px] tabular-nums', subjectLength > TICKET_SUBJECT_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground']"
                aria-hidden="true"
              >
                {{ t("tickets.create.count", { count: subjectLength, max: TICKET_SUBJECT_MAX_LENGTH }) }}
              </span>
            </div>
            <Input
              :id="SUBJECT_ID"
              v-model="subject"
              autocomplete="off"
              class="scroll-mt-24"
              :placeholder="t('tickets.create.fields.subjectPlaceholder')"
              :aria-invalid="fieldErrors.subject ? 'true' : undefined"
              :aria-describedby="fieldErrors.subject ? `${SUBJECT_ID}-error` : undefined"
              @input="handleFieldInput('subject')"
              @blur="handleFieldBlur('subject')"
            />
            <FieldError :id="`${SUBJECT_ID}-error`" :message="fieldErrors.subject" />
          </div>

          <div class="grid gap-1.5">
            <div class="flex items-baseline justify-between gap-3">
              <Label :for="MESSAGE_ID" class="text-xs font-normal text-muted-foreground">{{ t("tickets.create.fields.message") }}</Label>
              <span
                v-if="showsCharacterCount(messageLength, TICKET_MESSAGE_MAX_LENGTH)"
                :class="['text-[11px] tabular-nums', messageLength > TICKET_MESSAGE_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground']"
                aria-hidden="true"
              >
                {{ t("tickets.create.count", { count: messageLength, max: TICKET_MESSAGE_MAX_LENGTH }) }}
              </span>
            </div>
            <textarea
              :id="MESSAGE_ID"
              v-model="message"
              rows="8"
              :placeholder="t('tickets.create.fields.messagePlaceholder')"
              :aria-invalid="fieldErrors.message ? 'true' : undefined"
              :aria-describedby="fieldErrors.message ? `${MESSAGE_ID}-error` : `${MESSAGE_ID}-hint`"
              class="min-h-32 w-full min-w-0 scroll-mt-24 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
              @input="handleFieldInput('message')"
              @blur="handleFieldBlur('message')"
            />
            <FieldError :id="`${MESSAGE_ID}-error`" :message="fieldErrors.message" />
            <!-- What to include, for the category picked above. -->
            <p v-if="!fieldErrors.message" :id="`${MESSAGE_ID}-hint`" class="text-xs text-muted-foreground" data-testid="ticket-message-guide">
              {{ messageGuide }}
            </p>
          </div>
        </section>

        <div class="flex flex-wrap items-center justify-end gap-2 p-4">
          <Button as-child variant="ghost">
            <RouterLink :to="{ name: 'tickets.list' }">{{ t("common.cancel") }}</RouterLink>
          </Button>
          <Button type="submit" :disabled="submitting">
            <LucideLoader2 v-if="submitting" class="animate-spin" aria-hidden="true" />
            <LucideSend v-else aria-hidden="true" />
            {{ submitting ? t("tickets.create.submitting") : t("tickets.create.submit") }}
          </Button>
        </div>
      </form>

      <aside class="min-w-0 rounded-xl border bg-card p-4" aria-labelledby="ticket-create-tips-title" data-testid="ticket-create-tips">
        <h2 id="ticket-create-tips-title" class="text-sm font-semibold">{{ t("tickets.create.tips.title") }}</h2>
        <ul class="mt-2 grid list-disc gap-2 pl-4 text-xs leading-relaxed text-muted-foreground marker:text-muted-foreground/60">
          <li>
            <i18n-t keypath="tickets.create.tips.usage" tag="span" scope="global">
              <template #link>
                <RouterLink to="/friend-groups" class="font-medium text-foreground underline underline-offset-2">{{ t("tickets.create.tips.usageLink") }}</RouterLink>
              </template>
            </i18n-t>
          </li>
          <li>{{ t("tickets.create.tips.secrets") }}</li>
        </ul>
      </aside>
    </div>
  </div>
</template>
