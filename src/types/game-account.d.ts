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

// Used for create/update binding endpoints (server and game_user_id come from URL params)
export interface CreateGameAccountBindingPayload {
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
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
