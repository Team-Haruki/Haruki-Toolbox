import { createAdminReauthGate } from "@/lib/admin-reauth"

// App-wide slot for the admin re-authentication prompt. The admin shell
// registers its password dialog here; `request()` asks it whenever an admin
// route answers "reauthentication required", then retries the request once.
const gate = createAdminReauthGate()

export const registerAdminReauthPrompt = gate.register
export const requestAdminReauth = gate.request
