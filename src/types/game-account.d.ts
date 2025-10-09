import {SekaiRegion} from "@/types/store";

export interface SuiteDataPrivacySettings {
    allowPublicApi: boolean
    allowSakura: boolean
    allow8823: boolean
    allowResona: boolean
    allowLuna: boolean
}

export interface MysekaiDataPrivacySettings {
    allowPublicApi: boolean
    allowFixtureApi: boolean
    allow8823: boolean
    allowResona: boolean
    allowLuna: boolean
}

export interface GameAccountBindingPayload {
    server: SekaiRegion
    userId: string
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
}

export interface GenerateGameAccountCodePayload {
    server: SekaiRegion
    userId: string
}

export interface GameAccountBinding {
    id: number
    server: SekaiRegion
    userId: number
    verified: boolean
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
}

export type GameAccountBindingsUpdatedData = {
    gameAccountBindings: GameAccountBinding[]
}

export type GenerateGameAccountCodeResponse = {
    status: number
    message: string
    oneTimePassword: string
}