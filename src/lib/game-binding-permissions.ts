import { asRecord, readBoolean } from "@/lib/record-utils"

export interface SuitePermissions {
    allowPublicApi: boolean
    allowSakura: boolean
    allow8823: boolean
    allowResona: boolean
    allowLuna: boolean
}

export interface MysekaiPermissions {
    allowPublicApi: boolean
    allowFixtureApi: boolean
    allow8823: boolean
    allowResona: boolean
    allowLuna: boolean
}

const DEFAULT_SUITE_PERMISSIONS: SuitePermissions = {
    allowPublicApi: false,
    allowSakura: false,
    allow8823: false,
    allowResona: false,
    allowLuna: false,
}

const DEFAULT_MYSEKAI_PERMISSIONS: MysekaiPermissions = {
    allowPublicApi: false,
    allowFixtureApi: false,
    allow8823: false,
    allowResona: false,
    allowLuna: false,
}

export function normalizeSuitePermissions(value: unknown): SuitePermissions {
    const record = asRecord(value)
    if (!record) return { ...DEFAULT_SUITE_PERMISSIONS }
    return {
        allowPublicApi: readBoolean(record, ["allowPublicApi"]),
        allowSakura: readBoolean(record, ["allowSakura"]),
        allow8823: readBoolean(record, ["allow8823"]),
        allowResona: readBoolean(record, ["allowResona"]),
        allowLuna: readBoolean(record, ["allowLuna"]),
    }
}

export function normalizeMysekaiPermissions(value: unknown): MysekaiPermissions {
    const record = asRecord(value)
    if (!record) return { ...DEFAULT_MYSEKAI_PERMISSIONS }
    return {
        allowPublicApi: readBoolean(record, ["allowPublicApi"]),
        allowFixtureApi: readBoolean(record, ["allowFixtureApi"]),
        allow8823: readBoolean(record, ["allow8823"]),
        allowResona: readBoolean(record, ["allowResona"]),
        allowLuna: readBoolean(record, ["allowLuna"]),
    }
}
