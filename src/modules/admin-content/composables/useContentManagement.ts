import { onMounted, ref } from "vue"
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
    updateFriendGroupItem,
} from "@/modules/admin-content/api/friend-group"
import type { AdminFriendGroup, AdminFriendGroupItem, AdminFriendLink } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

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
    const linkForm = ref({ name: "", description: "", avatar: "", url: "", tags: "" })
    const linkSaving = ref(false)

    const groupsLoading = ref(true)
    const groups = ref<AdminFriendGroup[]>([])
    const groupDialogOpen = ref(false)
    const groupName = ref("")
    const groupSaving = ref(false)
    const actionLoading = ref(false)

    const itemDialogOpen = ref(false)
    const editingItem = ref<AdminFriendGroupItem | null>(null)
    const itemGroupId = ref("")
    const itemForm = ref({ name: "", avatar: "", bg: "", groupInfo: "", detail: "" })
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
        linkForm.value = { name: "", description: "", avatar: "", url: "", tags: "" }
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
        }
        linkDialogOpen.value = true
    }

    async function saveLink() {
        if (!linkForm.value.name.trim() || !linkForm.value.url.trim()) {
            toast.error(t("adminContent.toast.nameUrlRequired"))
            return
        }

        const data = {
            name: linkForm.value.name.trim(),
            description: linkForm.value.description.trim(),
            avatar: linkForm.value.avatar.trim(),
            url: linkForm.value.url.trim(),
            tags: linkForm.value.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }
        const editingId = editingLink.value?.id

        await runAsyncAction(linkSaving, async () => {
            if (editingId) {
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
        await runAsyncAction(actionLoading, () => deleteFriendLink(id), {
            successMessage: t("adminContent.toast.linkDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: () => loadLinks({ throwOnError: true, notifyOnError: false }),
        })
    }

    async function handleCreateGroup() {
        if (!groupName.value.trim()) {
            toast.error(t("adminContent.toast.groupNameRequired"))
            return
        }

        await runAsyncAction(groupSaving, () => createFriendGroup({ group: groupName.value.trim() }), {
            successMessage: t("adminContent.toast.groupCreated"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.createFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async () => {
                await loadGroups({ throwOnError: true, notifyOnError: false })
                groupDialogOpen.value = false
                groupName.value = ""
            },
        })
    }

    async function handleDeleteGroup(groupId: number | string) {
        await runAsyncAction(actionLoading, () => deleteFriendGroup(String(groupId)), {
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
        itemForm.value = { name: "", avatar: "", bg: "", groupInfo: "", detail: "" }
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
        }
        itemDialogOpen.value = true
    }

    async function saveItem() {
        if (!itemForm.value.name.trim()) {
            toast.error(t("adminContent.toast.itemNameRequired"))
            return
        }

        const data = {
            name: itemForm.value.name.trim(),
            avatar: itemForm.value.avatar.trim(),
            bg: itemForm.value.bg.trim(),
            groupInfo: itemForm.value.groupInfo.trim() || undefined,
            detail: itemForm.value.detail.trim() || undefined,
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
        await runAsyncAction(actionLoading, () => deleteFriendGroupItem(String(groupId), String(itemId)), {
            successMessage: t("adminContent.toast.itemDeleted"),
            successAfterOnSuccess: true,
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: () => loadGroups({ throwOnError: true, notifyOnError: false }),
        })
    }

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
        groupName,
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
        handleCreateGroup,
        handleDeleteGroup,
        openCreateItem,
        openEditItem,
        saveItem,
        handleDeleteItem,
    }
}
