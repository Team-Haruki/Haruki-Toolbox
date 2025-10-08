import type {UserSettings} from "@/types/get-settings";

export interface LoginRequest {
    email: string
    password: string
    challengeToken: string
}

export interface LoginResponse {
    status: number
    message: string
    userData: UserSettings
}
