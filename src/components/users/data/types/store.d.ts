export type SekaiRegion = "jp" | "en" | "tw" | "kr" | "cn"

export interface EmailInfo {
    email: string
    verified: boolean
}

export interface SocialPlatformInfo {
    platform: string
    userId: string
    verified: boolean
}

export interface AuthorizeSocialPlatformInfo {
    id: number
    platform: string
    userId: string
    comment: string
}

export interface SuiteDataPrivacySettings {
    allowPublicApi: boolean,
    allowSakura: boolean,
    allow8823: boolean,
    allowResona: boolean,
}

export interface MysekaiDataPrivacySettings {
    allowPublicApi: boolean,
    allowFixtureApi: boolean,
    allow8823: boolean,
    allowResona: boolean,
}

export interface GameAccountBinding {
    server: SekaiRegion
    userId: number
    verified: boolean
    suite?: SuiteDataPrivacySettings | null
    mysekai?: MysekaiDataPrivacySettings | null
}

