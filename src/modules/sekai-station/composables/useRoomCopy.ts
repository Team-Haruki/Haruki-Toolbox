import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { copyTextToClipboard } from "@/lib/clipboard"
import type { StationRoom } from "@/modules/sekai-station/lib/station-types"

/** Copies a room number or the whole post and reports the result in a toast */
export function useRoomCopy() {
  const { t } = useI18n()

  async function copy(text: string): Promise<boolean> {
    const ok = await copyTextToClipboard(text)
    if (ok) {
      toast.success(t("sekaiStation.rooms.copied"))
    } else {
      toast.error(t("sekaiStation.rooms.copyFailed"))
    }
    return ok
  }

  return {
    copyId: (room: StationRoom) => copy(room.id),
    copyText: (room: StationRoom) => copy(`${room.id}\n${room.msg}`),
  }
}
