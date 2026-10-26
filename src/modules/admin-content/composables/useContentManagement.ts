import { onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import {
    createFriendLink,
    deleteFriendLink,
    getFriendLinks,
    updateFriendLink,
} from "@/modules/admin-content/api/friend-link"
import {
    createFriendGroup,
    createFriendGroupItem,
    deleteFriendGroup,
    deleteFriendGroupItem,
    getFriendGroups,
    updateFriendGroup,
    updateFriendGroupItem,
} from "@/modules/admin-content/api/friend-group"
import {
    CONTENT_FIELD_IDS,
    type GroupFormField,
    type ItemFormField,
    type LinkFormField,
    firstInvalidField,
    validateGroupForm,
    validateItemForm,
    validateLinkForm,
} from "@/modules/admin-content/lib/form-validation"
import type { AdminFriendGroup, AdminFriendGroupItem, AdminFriendLink } from "@/types/admin"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { focusInvalidField } from "@/lib/form-focus"

type LoadOptions = {
    throwOnError?: boolean
}

/** Per-field messages, already translated, for the three dialogs. */
export type LinkFormErrorMessages = Partial<Record<LinkFormField, string>>
export type ItemFormErrorMessages = Partial<Record<ItemFormField, string>>
export type GroupFormErrorMessages = Partial<Record<GroupFormField, string>>

const LINK_FIELD_ORDER: readonly LinkFormField[] = ["name", "url"]
const ITEM_FIELD_ORDER: readonly ItemFormField[] = ["name", "url"]

export function useContentManagement() {
    const { t } = useI18n()
    const linksLoading = ref(true)
    // A failed load renders inline (LoadErrorState); the empty state is for a real empty list.
    const linksLoadError = ref<ErrorDescription | null>(null)
    const links = ref<AdminFriendLink[]>([])
    const linkDialogOpen = ref(false)
    const editingLink = ref<AdminFriendLink | null>(null)
    const linkForm = ref({ name: "", description: "", avatar: "", url: "", tags: "", sortOrder: 0 })
    const linkFormErrors = ref<LinkFormErrorMessages>({})
    const linkSaving = ref(false)

    const groupsLoading = ref(true)
    const groupsLoadError = ref<ErrorDescription | null>(null)
    const groups = ref<AdminFriendGroup[]>([])
    const groupDialogOpen = ref(false)
    const editingGroup = ref<AdminFriendGroup | null>(null)
    const groupName = ref("")
    const groupSortOrder = ref(0)
    const groupFormErrors = ref<GroupFormErrorMessages>({})
    const groupSaving = ref(false)
    const linkDeleting = ref(false)
    const groupDeleting = ref(false)
    const itemDeleting = ref(false)

    // Delete confirmations: the dialog runs the delete and reports failures inline.
    const linkToDelete = ref<AdminFriendLink | null>(null)
    const linkDeleteOpen = ref(false)
    const groupToDelete = ref<AdminFriendGroup | null>(null)
    const groupDeleteOpen = ref(false)
    const itemToDelete = ref<{ groupId: string; item: AdminFriendGroupItem } | null>(null)
    const itemDeleteOpen = ref(false)

    const itemDialogOpen = ref(false)
    const editingItem = ref<AdminFriendGroupItem | null>(null)
    const itemGroupId = ref("")
    const itemForm = ref({ name: "", avatar: "", bg: "", groupInfo: "", detail: "", url: "", sortOrder: 0 })
    const itemFormErrors = ref<ItemFormErrorMessages>({})
    const itemSaving = ref(false)
    let latestLinksRequestId = 0
    let latestGroupsRequestId = 0

    async function loadLinks(options: LoadOptions = {}) {
        const requestId = ++latestLinksRequestId
        linksLoading.value = true
        linksLoadError.value = null
        try {
            const data = await getFriendLinks()
            if (requestId !== latestLinksRequestId) return
            links.value = data
        } catch (e: unknown) {
            if (requestId !== latestLinksRequestId) return
            linksLoadError.value = describeError(e, t("adminContent.toast.loadLinksFailedTitle"))
            if (options.throwOnError) {
                throw e
            }
        } finally {
            if (requestId === latestLinksRequestId) {
                linksLoading.value = false
            }
        }
    }

    async function loadGroups(options: LoadOptions = {}) {
        const requestId = ++latestGroupsRequestId
        groupsLoading.value = true
        groupsLoadError.value = null
        try {
            const data = await getFriendGroups()
            if (requestId !== latestGroupsRequestId) return
            groups.value = data
        } catch (e: unknown) {
            if (requestId !== latestGroupsRequestId) return
            groupsLoadError.value = describeError(e, t("adminContent.toast.loadGroupsFailedTitle"))
            if (options.throwOnError) {
                throw e
            }
        } finally {
            if (requestId === latestGroupsRequestId) {
                groupsLoading.value = false
            }
        }
    }

    function clearLinkFormError(field: LinkFormField) {
        if (linkFormErrors.value[field]) {
            linkFormErrors.value = { ...linkFormErrors.value, [field]: undefined }
        }
    }

    function clearItemFormError(field: ItemFormField) {
        if (itemFormErrors.value[field]) {
            itemFormErrors.value = { ...itemFormErrors.value, [field]: undefined }
        }
    }

    function clearGroupFormError(field: GroupFormField) {
        if (groupFormErrors.value[field]) {
            groupFormErrors.value = { ...groupFormErrors.value, [field]: undefined }
        }
    }

    function openCreateLink() {
        editingLink.value = null
        const nextSortOrder = links.value.reduce((max, link) => Math.max(max, link.sortOrder ?? 0), 0) + 1
        linkForm.value = { name: "", description: "", avatar: "", url: "", tags: "", sortOrder: nextSortOrder }
        linkFormErrors.value = {}
        linkDialogOpen.value = true
    }

    function openEditLink(link: AdminFriendLink) {
        editingLink.value = link
        linkForm.value = {
            name: link.name,
            description: link.description,
            avatar: link.avatar,
            url: link.url,
            tags: (link.tags || []).join(", "),
            sortOrder: link.sortOrder ?? 0,
        }
        linkFormErrors.value = {}
        linkDialogOpen.value = true
    }

    async function saveLink() {
        const validation = validateLinkForm(linkForm.value)
        if (validation.errors) {
            linkFormErrors.value = Object.fromEntries(
                Object.entries(validation.errors).map(([field, code]) => [field, t(`adminContent.validation.${code}`)])
            )
            const firstInvalid = firstInvalidField(validation.errors, LINK_FIELD_ORDER)
            if (firstInvalid) focusInvalidField(CONTENT_FIELD_IDS.link[firstInvalid])
            return
        }
        linkFormErrors.value = {}

        const sortOrder = Number(linkForm.value.sortOrder)
        const data = {
            name: linkForm.value.name.trim(),
            description: linkForm.value.description.trim(),
            avatar: linkForm.value.avatar.trim(),
            url: validation.normalizedUrl,
            tags: linkForm.value.tags.split(",").map((t) => t.trim()).filter(Boolean),
            sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
        }
        const editingId = editingLink.value?.id

        await runAsyncAction(linkSaving, async () => {
            if (editingId !== undefined && editingId !== null && editingId !== "") {
                await updateFriendLink(editingId, data)
                return t("adminContent.toast.linkUpdated")
            }
            await createFriendLink(data)
            return t("adminContent.toast.linkCreated")
        }, {
            successMessage: (message) => message,
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.saveFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async () => {
                linkDialogOpen.value = false
                await loadLinks({ throwOnError: true })
            },
        })
    }

    function requestDeleteLink(link: AdminFriendLink) {
        linkToDelete.value = link
        linkDeleteOpen.value = true
    }

    /** Runs inside the confirm dialog; rejects on failure so the dialog shows it. */
    async function executeDeleteLink() {
        const target = linkToDelete.value
        if (!target) return
        await runAsyncAction(linkDeleting, () => deleteFriendLink(target.id), {
            successMessage: t("adminContent.toast.linkDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            throwOnError: true,
            onSuccess: () => loadLinks({ throwOnError: true }),
        })
    }

    function openCreateGroup() {
        editingGroup.value = null
        groupName.value = ""
        groupSortOrder.value = groups.value.reduce((max, group) => Math.max(max, group.sortOrder ?? 0), 0) + 1
        groupFormErrors.value = {}
        groupDialogOpen.value = true
    }

    function openEditGroup(group: AdminFriendGroup) {
        editingGroup.value = group
        groupName.value = group.group
        groupSortOrder.value = group.sortOrder ?? 0
        groupFormErrors.value = {}
        groupDialogOpen.value = true
    }

    async function handleSaveGroup() {
        const errors = validateGroupForm({ name: groupName.value })
        if (errors.name) {
            groupFormErrors.value = { name: t(`adminContent.validation.${errors.name}`) }
            focusInvalidField(CONTENT_FIELD_IDS.group.name)
            return
        }
        groupFormErrors.value = {}

        const sortOrder = Number(groupSortOrder.value)
        const data = {
            group: groupName.value.trim(),
            sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
        }
        const editingId = editingGroup.value?.id

        await runAsyncAction(groupSaving, async () => {
            if (editingId !== undefined && editingId !== null && editingId !== "") {
                await updateFriendGroup(String(editingId), data)
                return t("adminContent.toast.groupUpdated")
            }
            await createFriendGroup(data)
            return t("adminContent.toast.groupCreated")
        }, {
            successMessage: (message) => message,
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.saveFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async () => {
                groupDialogOpen.value = false
                await loadGroups({ throwOnError: true })
            },
        })
    }

    function requestDeleteGroup(group: AdminFriendGroup) {
        groupToDelete.value = group
        groupDeleteOpen.value = true
    }

    async function executeDeleteGroup() {
        const target = groupToDelete.value
        if (!target) return
        await runAsyncAction(groupDeleting, () => deleteFriendGroup(String(target.id)), {
            successMessage: t("adminContent.toast.groupDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            throwOnError: true,
            onSuccess: () => loadGroups({ throwOnError: true }),
        })
    }

    function openCreateItem(groupId: number | string) {
        editingItem.value = null
        itemGroupId.value = String(groupId)
        const currentGroup = groups.value.find((group) => String(group.id) === String(groupId))
        const nextSortOrder = (currentGroup?.groupList ?? []).reduce((max, item) => Math.max(max, item.sortOrder ?? 0), 0) + 1
        itemForm.value = { name: "", avatar: "", bg: "", groupInfo: "", detail: "", url: "", sortOrder: nextSortOrder }
        itemFormErrors.value = {}
        itemDialogOpen.value = true
    }

    function openEditItem(groupId: number | string, item: AdminFriendGroupItem) {
        editingItem.value = item
        itemGroupId.value = String(groupId)
        itemForm.value = {
            name: item.name,
            avatar: item.avatar,
            bg: item.bg,
            groupInfo: item.groupInfo || "",
            detail: item.detail || "",
            url: item.url || "",
            sortOrder: item.sortOrder ?? 0,
        }
        itemFormErrors.value = {}
        itemDialogOpen.value = true
    }

    async function saveItem() {
        const validation = validateItemForm(itemForm.value)
        if (validation.errors) {
            itemFormErrors.value = Object.fromEntries(
                Object.entries(validation.errors).map(([field, code]) => [field, t(`adminContent.validation.${code}`)])
            )
            const firstInvalid = firstInvalidField(validation.errors, ITEM_FIELD_ORDER)
            if (firstInvalid) focusInvalidField(CONTENT_FIELD_IDS.item[firstInvalid])
            return
        }
        itemFormErrors.value = {}

        const itemSortOrder = Number(itemForm.value.sortOrder)
        const data = {
            name: itemForm.value.name.trim(),
            avatar: itemForm.value.avatar.trim(),
            bg: itemForm.value.bg.trim(),
            groupInfo: itemForm.value.groupInfo.trim() || undefined,
            detail: itemForm.value.detail.trim() || undefined,
            url: validation.normalizedUrl,
            sortOrder: Number.isFinite(itemSortOrder) && itemSortOrder >= 0 ? itemSortOrder : 0,
        }
        const editingItemId = editingItem.value?.id

        await runAsyncAction(itemSaving, async () => {
            if (editingItemId !== undefined && editingItemId !== null) {
                await updateFriendGroupItem(itemGroupId.value, String(editingItemId), data)
                return t("adminContent.toast.itemUpdated")
            }
            await createFriendGroupItem(itemGroupId.value, data)
            return t("adminContent.toast.itemCreated")
        }, {
            successMessage: (message) => message,
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.saveFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async () => {
                itemDialogOpen.value = false
                await loadGroups({ throwOnError: true })
            },
        })
    }

    function requestDeleteItem(groupId: number | string, item: AdminFriendGroupItem) {
        itemToDelete.value = { groupId: String(groupId), item }
        itemDeleteOpen.value = true
    }

    async function executeDeleteItem() {
        const target = itemToDelete.value
        if (!target) return
        await runAsyncAction(itemDeleting, () => deleteFriendGroupItem(target.groupId, String(target.item.id)), {
            successMessage: t("adminContent.toast.itemDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            throwOnError: true,
            onSuccess: () => loadGroups({ throwOnError: true }),
        })
    }

    watch(groupDialogOpen, (open) => {
        if (!open) {
            groupName.value = ""
            groupSortOrder.value = 0
            editingGroup.value = null
            groupFormErrors.value = {}
        }
    })

    watch(linkDialogOpen, (open) => {
        if (!open) linkFormErrors.value = {}
    })

    watch(itemDialogOpen, (open) => {
        if (!open) itemFormErrors.value = {}
    })

    onMounted(() => {
        void loadLinks()
        void loadGroups()
    })

    return {
        linksLoading,
        linksLoadError,
        links,
        linkDialogOpen,
        editingLink,
        linkForm,
        linkFormErrors,
        linkSaving,
        groupsLoading,
        groupsLoadError,
        groups,
        groupDialogOpen,
        editingGroup,
        groupName,
        groupSortOrder,
        groupFormErrors,
        groupSaving,
        itemDialogOpen,
        editingItem,
        itemGroupId,
        itemForm,
        itemFormErrors,
        itemSaving,
        linkToDelete,
        linkDeleteOpen,
        groupToDelete,
        groupDeleteOpen,
        itemToDelete,
        itemDeleteOpen,
        loadLinks,
        loadGroups,
        clearLinkFormError,
        clearItemFormError,
        clearGroupFormError,
        openCreateLink,
        openEditLink,
        saveLink,
        requestDeleteLink,
        executeDeleteLink,
        openCreateGroup,
        openEditGroup,
        handleSaveGroup,
        requestDeleteGroup,
        executeDeleteGroup,
        openCreateItem,
        openEditItem,
        saveItem,
        requestDeleteItem,
        executeDeleteItem,
    }
}
