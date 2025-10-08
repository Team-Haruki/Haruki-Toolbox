import type {UserSettings} from "@/types/get-settings";

export interface RegisterPayload {
    name: string
    email: string
    password: string
    oneTimePassword: string
    challengeToken: string
}

export interface RegisterSuccessResponse {
    status: number
    message: string
    userData: UserSettings
}
