import { onMounted, ref, watch } from "vue"
import { toast } from "vue-sonner"
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
import type { AdminFriendGroup, AdminFriendGroupItem, AdminFriendLink } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { normalizeExternalHttpUrl } from "@/lib/external-url"

type LoadOptions = {
    throwOnError?: boolean
    notifyOnError?: boolean
}

export function useContentManagement() {
    const { t } = useI18n()
    const linksLoading = ref(true)
    const links = ref<AdminFriendLink[]>([])
    const linkDialogOpen = ref(false)
    const editingLink = ref<AdminFriendLink | null>(null)
    const linkForm = ref({ name: "", description: "", avatar: "", url: "", tags: "", sortOrder: 0 })
    const linkSaving = ref(false)

    const groupsLoading = ref(true)
    const groups = ref<AdminFriendGroup[]>([])
    const groupDialogOpen = ref(false)
    const editingGroup = ref<AdminFriendGroup | null>(null)
    const groupName = ref("")
    const groupSortOrder = ref(0)
    const groupSaving = ref(false)
    const linkDeleting = ref(false)
    const groupDeleting = ref(false)
    const itemDeleting = ref(false)

    const itemDialogOpen = ref(false)
    const editingItem = ref<AdminFriendGroupItem | null>(null)
    const itemGroupId = ref("")
    const itemForm = ref({ name: "", avatar: "", bg: "", groupInfo: "", detail: "", url: "", sortOrder: 0 })
    const itemSaving = ref(false)
    let latestLinksRequestId = 0
    let latestGroupsRequestId = 0

    async function loadLinks(options: LoadOptions = {}) {
        const notifyOnError = options.notifyOnError ?? true
        const requestId = ++latestLinksRequestId
        linksLoading.value = true
        try {
            const data = await getFriendLinks()
            if (requestId !== latestLinksRequestId) return
            links.value = data
        } catch (e: unknown) {
            if (requestId !== latestLinksRequestId) return
            if (notifyOnError) {
                toastErrorWithExtractedMessage(
                    t("adminContent.toast.loadLinksFailedTitle"),
                    e,
                    t("adminContent.toast.actionFailedFallback")
                )
            }
            if (options.throwOnError) {
                throw e
            }
        } finally {
            if (requestId !== latestLinksRequestId) return
            linksLoading.value = false
        }
    }

    async function loadGroups(options: LoadOptions = {}) {
        const notifyOnError = options.notifyOnError ?? true
        const requestId = ++latestGroupsRequestId
        groupsLoading.value = true
        try {
            const data = await getFriendGroups()
            if (requestId !== latestGroupsRequestId) return
            groups.value = data
        } catch (e: unknown) {
            if (requestId !== latestGroupsRequestId) return
            if (notifyOnError) {
                toastErrorWithExtractedMessage(
                    t("adminContent.toast.loadGroupsFailedTitle"),
                    e,
                    t("adminContent.toast.actionFailedFallback")
                )
            }
            if (options.throwOnError) {
                throw e
            }
        } finally {
            if (requestId !== latestGroupsRequestId) return
            groupsLoading.value = false
        }
    }

    function openCreateLink() {
        editingLink.value = null
        const nextSortOrder = links.value.reduce((max, link) => Math.max(max, link.sortOrder ?? 0), 0) + 1
        linkForm.value = { name: "", description: "", avatar: "", url: "", tags: "", sortOrder: nextSortOrder }
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
        linkDialogOpen.value = true
    }

    async function saveLink() {
        if (!linkForm.value.name.trim() || !linkForm.value.url.trim()) {
            toast.error(t("adminContent.toast.nameUrlRequired"))
            return
        }

        const normalizedUrl = normalizeExternalHttpUrl(linkForm.value.url)
        if (!normalizedUrl) {
            toast.error(t("adminContent.toast.saveFailedTitle"), {
                description: t("adminContent.toast.invalidLinkUrl"),
            })
            return
        }

        const sortOrder = Number(linkForm.value.sortOrder)
        const data = {
            name: linkForm.value.name.trim(),
            description: linkForm.value.description.trim(),
            avatar: linkForm.value.avatar.trim(),
            url: normalizedUrl,
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
                await loadLinks({ throwOnError: true, notifyOnError: false })
                linkDialogOpen.value = false
            },
        })
    }

    async function handleDeleteLink(id: string) {
        await runAsyncAction(linkDeleting, () => deleteFriendLink(id), {
            successMessage: t("adminContent.toast.linkDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: () => loadLinks({ throwOnError: true, notifyOnError: false }),
        })
    }

    function openCreateGroup() {
        editingGroup.value = null
        groupName.value = ""
        groupSortOrder.value = groups.value.reduce((max, group) => Math.max(max, group.sortOrder ?? 0), 0) + 1
        groupDialogOpen.value = true
    }

    function openEditGroup(group: AdminFriendGroup) {
        editingGroup.value = group
        groupName.value = group.group
        groupSortOrder.value = group.sortOrder ?? 0
        groupDialogOpen.value = true
    }

    async function handleSaveGroup() {
        if (!groupName.value.trim()) {
            toast.error(t("adminContent.toast.groupNameRequired"))
            return
        }

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
                await loadGroups({ throwOnError: true, notifyOnError: false })
                groupDialogOpen.value = false
            },
        })
    }

    async function handleDeleteGroup(groupId: number | string) {
        await runAsyncAction(groupDeleting, () => deleteFriendGroup(String(groupId)), {
            successMessage: t("adminContent.toast.groupDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: () => loadGroups({ throwOnError: true, notifyOnError: false }),
        })
    }

    function openCreateItem(groupId: number | string) {
        editingItem.value = null
        itemGroupId.value = String(groupId)
        const currentGroup = groups.value.find((group) => String(group.id) === String(groupId))
        const nextSortOrder = (currentGroup?.groupList ?? []).reduce((max, item) => Math.max(max, item.sortOrder ?? 0), 0) + 1
        itemForm.value = { name: "", avatar: "", bg: "", groupInfo: "", detail: "", url: "", sortOrder: nextSortOrder }
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
        itemDialogOpen.value = true
    }

    async function saveItem() {
        if (!itemForm.value.name.trim()) {
            toast.error(t("adminContent.toast.itemNameRequired"))
            return
        }

        const normalizedUrl = itemForm.value.url.trim()
            ? normalizeExternalHttpUrl(itemForm.value.url)
            : undefined
        if (itemForm.value.url.trim() && !normalizedUrl) {
            toast.error(t("adminContent.toast.saveFailedTitle"), {
                description: t("adminContent.toast.invalidLinkUrl"),
            })
            return
        }

        const itemSortOrder = Number(itemForm.value.sortOrder)
        const data = {
            name: itemForm.value.name.trim(),
            avatar: itemForm.value.avatar.trim(),
            bg: itemForm.value.bg.trim(),
            groupInfo: itemForm.value.groupInfo.trim() || undefined,
            detail: itemForm.value.detail.trim() || undefined,
            url: normalizedUrl,
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
                await loadGroups({ throwOnError: true, notifyOnError: false })
                itemDialogOpen.value = false
            },
        })
    }

    async function handleDeleteItem(groupId: number | string, itemId: number | string) {
        await runAsyncAction(itemDeleting, () => deleteFriendGroupItem(String(groupId), String(itemId)), {
            successMessage: t("adminContent.toast.itemDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: () => loadGroups({ throwOnError: true, notifyOnError: false }),
        })
    }

    watch(groupDialogOpen, (open) => {
        if (!open) {
            groupName.value = ""
            groupSortOrder.value = 0
            editingGroup.value = null
        }
    })

    onMounted(() => {
        void loadLinks()
        void loadGroups()
    })

    return {
        linksLoading,
        links,
        linkDialogOpen,
        editingLink,
        linkForm,
        linkSaving,
        groupsLoading,
        groups,
        groupDialogOpen,
        editingGroup,
        groupName,
        groupSortOrder,
        groupSaving,
        itemDialogOpen,
        editingItem,
        itemGroupId,
        itemForm,
        itemSaving,
        openCreateLink,
        openEditLink,
        saveLink,
        handleDeleteLink,
        openCreateGroup,
        openEditGroup,
        handleSaveGroup,
        handleDeleteGroup,
        openCreateItem,
        openEditItem,
        saveItem,
        handleDeleteItem,
    }
}
