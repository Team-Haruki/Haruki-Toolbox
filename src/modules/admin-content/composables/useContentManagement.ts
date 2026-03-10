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

    async function loadLinks() {
        linksLoading.value = true
        try {
            links.value = await getFriendLinks()
        } catch (e: unknown) {
            toastErrorWithExtractedMessage(
                t("adminContent.toast.loadLinksFailedTitle"),
                e,
                t("adminContent.toast.actionFailedFallback")
            )
        } finally {
            linksLoading.value = false
        }
    }

    async function loadGroups() {
        groupsLoading.value = true
        try {
            groups.value = await getFriendGroups()
        } catch (e: unknown) {
            toastErrorWithExtractedMessage(
                t("adminContent.toast.loadGroupsFailedTitle"),
                e,
                t("adminContent.toast.actionFailedFallback")
            )
        } finally {
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
            errorTitle: t("adminContent.toast.saveFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async (successMessage) => {
                toast.success(successMessage)
                linkDialogOpen.value = false
                await loadLinks()
            },
        })
    }

    async function handleDeleteLink(id: string) {
        await runAsyncAction(actionLoading, () => deleteFriendLink(id), {
            successMessage: t("adminContent.toast.linkDeleted"),
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: loadLinks,
        })
    }

    async function handleCreateGroup() {
        if (!groupName.value.trim()) {
            toast.error(t("adminContent.toast.groupNameRequired"))
            return
        }

        await runAsyncAction(groupSaving, () => createFriendGroup({ group: groupName.value.trim() }), {
            successMessage: t("adminContent.toast.groupCreated"),
            errorTitle: t("adminContent.toast.createFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async () => {
                groupDialogOpen.value = false
                groupName.value = ""
                await loadGroups()
            },
        })
    }

    async function handleDeleteGroup(groupId: number | string) {
        await runAsyncAction(actionLoading, () => deleteFriendGroup(String(groupId)), {
            successMessage: t("adminContent.toast.groupDeleted"),
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: loadGroups,
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
            errorTitle: t("adminContent.toast.saveFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: async (successMessage) => {
                toast.success(successMessage)
                itemDialogOpen.value = false
                await loadGroups()
            },
        })
    }

    async function handleDeleteItem(groupId: number | string, itemId: number | string) {
        await runAsyncAction(actionLoading, () => deleteFriendGroupItem(String(groupId), String(itemId)), {
            successMessage: t("adminContent.toast.itemDeleted"),
            errorTitle: t("adminContent.toast.deleteFailedTitle"),
            fallbackError: t("adminContent.toast.actionFailedFallback"),
            onSuccess: loadGroups,
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
