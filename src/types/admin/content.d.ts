import type { EntityId } from "@/types/common"

export interface AdminFriendLink {
  id: string
  name: string
  description: string
  avatar: string
  url: string
  tags?: string[]
}

export interface AdminFriendGroup {
  id: EntityId
  group: string
  groupList?: AdminFriendGroupItem[]
}

export interface AdminFriendGroupItem {
  id: EntityId
  name: string
  avatar: string
  bg: string
  groupInfo?: string
  detail?: string
}
