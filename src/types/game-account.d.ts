import type {
    GameAccountBinding as StoreGameAccountBinding,
    MysekaiDataPrivacySettings,
    SekaiRegion,
    SuiteDataPrivacySettings,
} from "@/types/store"

export interface GameAccountBindingPayload {
    server: SekaiRegion
    userId: string
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
}

export type UploadDataType = "suite" | "mysekai"
export type InheritServer = Extract<SekaiRegion, "jp" | "en">
export type GameAccountGrantDataType = "suite" | "mysekai"

// Used for create/update binding endpoints (server and game_user_id come from URL params)
export interface CreateGameAccountBindingPayload {
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
    isDefault?: boolean
}

export interface GameAccountBinding extends StoreGameAccountBinding {
    id: number
}

export type GameAccountBindingsUpdatedData = {
    gameAccountBindings: GameAccountBinding[]
}

export type GenerateGameAccountCodeResponse = {
    status: number
    message: string
    oneTimePassword?: string
    updatedData?: {
        oneTimePassword?: string
    }
}

export interface GameAccountDataGrant {
    id: number
    ownerUserId: string
    granteeUserId: string
    server: SekaiRegion
    gameUserId: string
    dataType: GameAccountGrantDataType
    expiresAt: string
    createdAt: string
    updatedAt: string
}

export interface GameAccountDataGrantListResponse {
    generatedAt: string
    total: number
    items: GameAccountDataGrant[]
}

export interface GameAccountDataGrantMutationResponse {
    generatedAt: string
    grant: GameAccountDataGrant
}
