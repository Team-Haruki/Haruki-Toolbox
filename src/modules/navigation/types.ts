export interface FriendLinkItem {
  id: string | number
  name: string
  description: string
  avatar: string
  url: string
  tags: string[]
}

export interface FriendGroupItem {
  name: string
  avatar: string
  bg: string
  groupInfo: string
  detail: string
  url?: string
}

export interface FriendGroupData {
  group: string
  groupList: FriendGroupItem[]
}
