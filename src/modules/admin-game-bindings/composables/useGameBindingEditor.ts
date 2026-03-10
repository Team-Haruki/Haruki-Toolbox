import { ref } from "vue"
import { normalizeMysekaiPermissions, normalizeSuitePermissions } from "@/lib/game-binding-permissions"
import type { SekaiRegion } from "@/types/store"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"
import { DEFAULT_SERVER } from "@/modules/admin-game-bindings/lib/management-meta"

function createEmptySuitePermissions() {
  return normalizeSuitePermissions(null)
}

function createEmptyMysekaiPermissions() {
  return normalizeMysekaiPermissions(null)
}

export function useGameBindingEditor() {
  const editDialogOpen = ref(false)
  const editTargetUserId = ref("")
  const editServer = ref<SekaiRegion>(DEFAULT_SERVER)
  const editGameUserId = ref("")
  const editOriginalServer = ref<SekaiRegion>(DEFAULT_SERVER)
  const editOriginalGameUserId = ref("")
  const editSuite = ref(createEmptySuitePermissions())
  const editMysekai = ref(createEmptyMysekaiPermissions())
  const isEditMode = ref(false)

  function resetEditForm() {
    editTargetUserId.value = ""
    editServer.value = DEFAULT_SERVER
    editGameUserId.value = ""
    editOriginalServer.value = DEFAULT_SERVER
    editOriginalGameUserId.value = ""
    editSuite.value = createEmptySuitePermissions()
    editMysekai.value = createEmptyMysekaiPermissions()
  }

  function openAddBinding() {
    isEditMode.value = false
    resetEditForm()
    editDialogOpen.value = true
  }

  function openEditBinding(binding: GlobalGameBinding) {
    isEditMode.value = true
    editTargetUserId.value = binding.userId
    editServer.value = binding.server
    editGameUserId.value = binding.gameUserId
    editOriginalServer.value = binding.server
    editOriginalGameUserId.value = binding.gameUserId
    editSuite.value = normalizeSuitePermissions(binding.suite)
    editMysekai.value = normalizeMysekaiPermissions(binding.mysekai)
    editDialogOpen.value = true
  }

  return {
    editDialogOpen,
    editTargetUserId,
    editServer,
    editGameUserId,
    editOriginalServer,
    editOriginalGameUserId,
    editSuite,
    editMysekai,
    isEditMode,
    openAddBinding,
    openEditBinding,
  }
}
