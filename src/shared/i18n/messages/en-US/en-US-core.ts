// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: app, common, turnstile, auth, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, homeSettings, core, catalog
export default {
  "uploadedGameData": {
    "missingTitle": "Game data has not been uploaded",
    "missing": {
      "suite": "This game account has never uploaded its game data (Suite, the full account data). Upload it on the \"Upload data\" page first, then come back and refresh.",
      "mysekai": "This game account has never uploaded its MySekai data. Upload it on the \"Upload data\" page first, then come back and refresh.",
      "profile": "There is no data for this game account yet, so the realtime profile cannot be read. Upload game data once on the \"Upload data\" page, then come back and refresh."
    },
    "missingGranted": "The owner of this account has not uploaded any game data yet. Ask them to upload it; if they allowed you to upload on their behalf, you can do so on the \"Upload data\" page.",
    "uploadAction": "Go to data upload",
    "uploadedAt": "Data uploaded at {time}",
    "grantLapsed": "Access to this account has expired or been revoked. Ask the owner to grant it again.",
    "refreshUpToDate": "Data is already up to date",
    "refreshUpdated": "Updated to {time}",
    "missingAccounts": "{count} bound accounts have no uploaded game data. Go to the data upload page to upload it.",
    "otherFailures": "Another {count} accounts could not be loaded. Try again later."
  },
  "app": {
    "name": "Haruki Toolbox"
  },
  "common": {
    "save": "Save",
    "reset": "Reset",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "close": "Close",
    "back": "Back",
    "tip": "Tip",
    "actionFailed": "The action failed. Try again later.",
    "postSuccessWarningTitle": "Operation succeeded with warnings",
    "postSuccessWarningDescription": "Follow-up refresh failed. Please reload the page if data looks outdated.",
    "guest": "Guest",
    "accountIndex": "Account {index}",
    "apiResponse": "Request failed",
    "missingUpdatedData": "{context}: the server returned incomplete data. Refresh the page and try again.",
    "selectDateTime": "Pick a date and time"
  },
  "backendMessages": {
    "notAuthenticated": "You are not signed in, or your session has expired. Sign in again and retry.",
    "uploadNotAllowed": "Your account is not allowed to upload data for this game account. Use the account that owns the binding, or ask the owner to grant you upload access.",
    "writeGrantExpired": "The upload access the owner granted you has expired or been revoked. Ask the owner to grant it again, or upload for a game account you own.",
    "bindingAccessDenied": "You do not have access to this game account's data. If the account was shared with you, the grant may have expired or been revoked; ask the owner to grant it again.",
    "invalidServer": "The selected game server is invalid. Pick a server again and retry.",
    "uploadProcessFailed": "The uploaded data could not be processed. Make sure the file is complete, unmodified capture data, then upload it again.",
    "mysekaiRetrieveFailed": "MySekai (home area) data could not be retrieved; this game account may not have finished the MySekai tutorial yet. Finish it in the game and try again.",
    "suiteRetrieveFailed": "An unknown error occurred while retrieving game data. Try again later; if it keeps failing, open a support ticket.",
    "gameDataRetrieveFailed": "Game data could not be retrieved from the game server. Check that the transfer ID and password are correct and not expired, then try again later.",
    "verificationCodeMissing": "The verification code was not found in your in-game profile comment. Paste the whole code into the comment, save it, return to the game home screen and try again.",
    "verificationCodeMismatch": "The code in your in-game profile comment does not match the one generated here. Paste the latest code into the comment, save it, return to the game home screen and try again.",
    "verificationCodeExpired": "The verification code has expired or does not exist. Generate a new code and try again.",
    "verificationTooManyAttempts": "Too many verification attempts. Generate a new code and try again.",
    "gameAccountNotFound": "This game account was not found. Check the selected server and player ID.",
    "gameServerUnavailable": "The game server is currently unreachable, possibly under maintenance. Try again later.",
    "accountBoundByAnotherUser": "This game account is already bound to another user. If it is yours, open a support ticket.",
    "accountBoundByBannedUser": "This game account is bound to a banned user. If it is yours, open a support ticket.",
    "bindingNotVerified": "This game account binding has not been verified yet. Complete verification on the game account management page first.",
    "bindingLocked": "This binding has been locked by an administrator and cannot be changed right now. Open a support ticket if you have questions.",
    "granteeNotFound": "The user to grant access to was not found. Check their Toolbox user ID.",
    "grantToSelf": "You cannot grant access to yourself. Enter another user's Toolbox user ID.",
    "expiresAtNotFuture": "The expiry time must be in the future. Pick another time.",
    "granteeBanned": "The user you are trying to grant access to is banned, so access cannot be granted.",
    "accountDeletionConfirmationRequired": "Refresh the page and enter the target user ID to confirm permanent deletion.",
    "accountDeletionBusy": "This account has a transfer job or deletion in progress. Wait for it to finish, then retry.",
    "accountDeletionUnavailable": "Deletion is not complete. Please try again shortly.",
    "qqBindingExists": "This QQ account is already linked to a Toolbox account. Unlink it from the original account before linking it here. Contact an administrator if you cannot sign in to the original account.",
    "emailVerificationRequired": "Verify your email address before binding a social platform account.",
    "codeInvalidOrExpired": "The verification code is invalid or has expired. Request a new code and try again.",
    "codeTooManyAttempts": "Too many verification attempts. Request a new code and try again.",
    "ticketClosed": "This ticket is closed and cannot receive replies. Open a new ticket for a new issue.",
    "ticketNotFound": "This ticket was not found; it may have been deleted. Go back to the ticket list and refresh.",
    "ticketQuotaExceeded": "You have reached the ticket limit. Wait for your existing tickets to be resolved before opening a new one.",
    "messageLength": "The message must be between 1 and 4000 characters. Adjust it and send again.",
    "captchaFailed": "The CAPTCHA check failed. Complete it again and retry.",
    "invalidVerificationCode": "The verification code is incorrect. Check it and enter it again.",
    "reauthRequired": "Re-enter your password to continue.",
    "consentChallengeExpired": "The authorization request has expired or is invalid. Go back to the app that started it and try again.",
    "loginChallengeRequired": "The authorization parameters are missing. Go back to the app that started it and try again.",
    "inheritFailed": "Transfer failed. Check that the transfer ID and password are correct, regenerate the transfer ID in the game and try again.",
    "inheritFailedWithCode": "Transfer failed (game server replied: {code}). Check that the transfer ID and password are correct, regenerate the transfer ID in the game and try again.",
    "suiteParseFailed": "The game data could not be parsed. Make sure you uploaded complete, unmodified capture data; if it keeps failing, open a support ticket.",
    "playerDataNotFound": "No data was found for this player. Upload game data first and try again.",
    "otpIncorrect": "The one-time password is incorrect. Check it and enter it again."
  },
  "turnstile": {
    "loading": "Loading CAPTCHA widget...",
    "loadFailed": "Failed to load CAPTCHA widget. Please check your connection and try again.",
    "retry": "Retry loading"
  },
  "auth": {
    "common": {
      "cancel": "Cancel",
      "loadingFlow": "Loading sign-in page…",
      "restartFlow": "Start again",
      "loadFlowFailed": "The {flow} has expired or cannot be reached right now. Use the button below to start again.",
      "serviceUnavailable": "The sign-in service cannot be reached right now. Try again later (code {status}).",
      "flowNames": {
        "login": "sign-in page",
        "registration": "registration page",
        "recovery": "password recovery page",
        "verification": "email verification page",
        "settings": "account security settings page"
      }
    },
    "kratos": {
      "labels": {
        "code": "Verification code",
        "codePlaceholder": "Enter the code from your email",
        "totpCode": "Authenticator code",
        "totpCodePlaceholder": "Enter the 6-digit code from your authenticator",
        "lookupSecret": "Backup recovery code",
        "savePassword": "Save password",
        "continueWithCode": "Sign in with email code",
        "sendLink": "Send link",
        "verify": "Verify",
        "submit": "Submit",
        "imageAlt": "Authenticator app QR code"
      },
      "text": {
        "1010001": "Sign in",
        "1010002": "Sign in with {provider}",
        "1010003": "Please confirm this action by verifying that it is you.",
        "1010004": "Please complete the second authentication step.",
        "1010005": "Verify",
        "1010006": "Authenticator code",
        "1010007": "Backup recovery code",
        "1010008": "Sign in with a security key",
        "1010009": "Use authenticator app",
        "1010010": "Use a backup recovery code",
        "1010011": "Sign in with a security key",
        "1010012": "Get your security key (USB key, fingerprint reader, ...) ready and press Continue.",
        "1010013": "Continue",
        "1010014": "A code was sent to the address you provided. If it doesn't arrive, check the address and try again.",
        "1010015": "Send sign-in code",
        "1010016": "You tried to sign in with {provider}, but the email {duplicateIdentifier} is already used by another account. Sign in to that account with one of the options below to add {provider} as another way to sign in.",
        "1010017": "Sign in and link",
        "1010018": "Confirm with {provider}",
        "1010019": "Request a code to continue",
        "1010020": "We will send a code to your address.",
        "1010021": "Sign in with passkey",
        "1010022": "Sign in with password",
        "1010023": "Send code to {address}",
        "1010024": "Sign in with a security key",
        "1010025": "A code was sent to your address. If it doesn't arrive, please try again.",
        "1010026": "Your account is managed by an organization. Please sign in with your organization's single sign-on.",
        "1040001": "Sign up",
        "1040002": "Sign up with {provider}",
        "1040003": "Continue",
        "1040004": "Sign up with a security key",
        "1040005": "A code was sent to the address you provided. If it doesn't arrive, check the address and sign up again.",
        "1040006": "Send sign-up code",
        "1040007": "Sign up with passkey",
        "1040008": "Back",
        "1040009": "Choose how you want to sign in to this account.",
        "1050001": "Your changes have been saved.",
        "1050002": "Link {provider} account",
        "1050003": "Unlink {provider} account",
        "1050004": "Remove authenticator app",
        "1050005": "Authenticator app QR code",
        "1050006": "{secret}",
        "1050007": "Show backup recovery codes",
        "1050008": "Generate new backup recovery codes",
        "1050009": "{secret}",
        "1050010": "These are your backup recovery codes. Each one works once. Keep them somewhere safe!",
        "1050011": "Confirm and turn on backup recovery codes",
        "1050012": "Add security key",
        "1050013": "Security key name",
        "1050014": "Used on {usedAt}",
        "1050015": "{secrets}",
        "1050016": "Turn off backup recovery codes",
        "1050017": "This is your authenticator app secret. Enter it manually if you can't scan the QR code.",
        "1050018": "Remove security key “{display_name}”",
        "1050019": "Add passkey",
        "1050020": "Remove passkey “{display_name}”",
        "1050023": "Your account is managed by your organization. To change these settings, contact your organization administrator.",
        "1050024": "Please set up a second authentication factor to continue.",
        "1060001": "You recovered your account. Please change your password or set up another sign-in method now.",
        "1060002": "We sent a password recovery email to the address you entered. Open the link in it; if it doesn't arrive, check your spam folder and make sure you used the address you signed up with.",
        "1060003": "We sent a recovery code to the address you entered. Enter it below; if it doesn't arrive, check your spam folder and make sure you used the address you signed up with.",
        "1060004": "A recovery code was sent to {masked_address}. If it doesn't arrive, check the address and make sure it is the one you signed up with.",
        "1060005": "Enter your full recovery address to recover access to your account.",
        "1060006": "How do you want to recover your account?",
        "1060007": "Back",
        "1070001": "Password",
        "1070002": "{title}",
        "1070003": "Save",
        "1070004": "Account",
        "1070005": "Submit",
        "1070006": "Verification code",
        "1070007": "Email",
        "1070008": "Resend code",
        "1070009": "Continue",
        "1070010": "Recovery code",
        "1070011": "Verification code",
        "1070012": "Registration code",
        "1070013": "Sign-in code",
        "1070014": "Sign in and link",
        "1070015": "Please complete the captcha to continue.",
        "1070016": "Recovery address",
        "1070017": "Phone number",
        "1070018": "Email or phone number",
        "1080001": "We sent a verification email to the address you entered. Open the link in it to finish; if it doesn't arrive, check your spam folder.",
        "1080002": "Your email address is verified.",
        "1080003": "We sent a verification code to the address you entered. Enter it below; if it doesn't arrive, check your spam folder.",
        "1080004": "We sent a verification code by text message to the number you entered. If it doesn't arrive, check the number.",
        "1080005": "Your phone number is verified.",
        "4000001": "This value is not valid. Please check it and try again.",
        "4000002": "Please fill in this field.",
        "4000003": "Too short: enter at least {min_length} characters.",
        "4000004": "The format is not valid. Please check it and try again.",
        "4000005": "This password can't be used. Please choose a different one.",
        "4000006": "The email or password is incorrect. Check them and try again, or use “Forgot password?” to reset it.",
        "4000007": "An account with this email already exists. Sign in instead, or use “Forgot password” to recover it.",
        "4000008": "The authentication code is incorrect. Enter the latest code from your authenticator.",
        "4000009": "No sign-in identifier was found. Enter your email and try again.",
        "4000010": "This account's email address is not verified yet. Please check your inbox and verify it first.",
        "4000011": "This account has no authenticator app set up.",
        "4000012": "This backup recovery code has already been used. Please use another one.",
        "4000013": "This account has no security key set up.",
        "4000014": "This account has no backup recovery codes set up.",
        "4000015": "This account doesn't exist or has no security key set up.",
        "4000016": "The backup recovery code is not valid. Please check it and try again.",
        "4000017": "Too long: enter at most {max_length} characters.",
        "4000018": "The value must be at least {minimum}.",
        "4000019": "The value must be greater than {minimum}.",
        "4000020": "The value must be at most {maximum}.",
        "4000021": "The value must be less than {maximum}.",
        "4000022": "The value must be a multiple of {base}.",
        "4000023": "Enter at most {max_items} items.",
        "4000024": "Enter at least {min_items} items.",
        "4000025": "Entries must not repeat.",
        "4000026": "The value has the wrong type.",
        "4000027": "An account with this email already exists. Sign in to it first, then link your social account.",
        "4000028": "{identifier} is already used by another account.",
        "4000029": "The value doesn't meet the requirements.",
        "4000030": "The value doesn't meet the requirements.",
        "4000031": "The password is too similar to your email. Please choose a different one.",
        "4000032": "The password is too short: use at least {min_length} characters.",
        "4000033": "The password is too long: use at most {max_length} characters.",
        "4000034": "This password has appeared in a known data breach and can't be used. Please choose a different one.",
        "4000035": "This account doesn't exist or hasn't turned on sign-in with a code.",
        "4000036": "The details don't match what you entered before. Please start over.",
        "4000037": "This account doesn't exist or has no sign-in method set up.",
        "4000038": "The captcha check failed. Please try again.",
        "4000039": "The new password must be different from your current one.",
        "4000040": "Enter a valid email address.",
        "4000041": "Enter a valid phone number.",
        "4000042": "This account has no device key set up.",
        "4000043": "The security key check failed. Please try again.",
        "4000044": "The device key signature is not valid.",
        "4000045": "This device key can no longer be used. Please add it again.",
        "4000046": "This device key was added before user verification was supported and can no longer be used. Please add it again.",
        "4000047": "You need to accept this to continue.",
        "4010001": "The sign-in page was open too long and has been refreshed. Please sign in again.",
        "4010002": "This sign-in request couldn't be processed. Check what you entered and try again.",
        "4010003": "This sign-up request couldn't be processed. Check what you entered and try again.",
        "4010004": "These settings couldn't be saved. Check what you entered and try again.",
        "4010005": "This recovery request couldn't be processed. Check what you entered and try again.",
        "4010006": "This verification request couldn't be processed. Check what you entered and try again.",
        "4010007": "This sign-in has already been completed and can't be submitted again. Please reload the page.",
        "4010008": "The sign-in code is invalid or has already been used. Please request a new one.",
        "4010009": "The linked sign-in methods don't match.",
        "4010010": "The address you entered doesn't match any address on this account.",
        "4010011": "This account has been disabled. Please contact the administrator.",
        "4040001": "The sign-up page was open too long and has been refreshed. Please fill it in again.",
        "4040002": "This sign-up has already been completed and can't be submitted again.",
        "4040003": "The sign-up code is invalid or has already been used. Please request a new one.",
        "4050001": "The settings page was open too long and has been refreshed. Please try again.",
        "4050002": "You can only change one address at a time. Please update each address separately.",
        "4060001": "This recovery has already been completed and can't be submitted again.",
        "4060002": "Account recovery ran into a problem. Please start over.",
        "4060003": "The link is missing its recovery token. Please start account recovery again.",
        "4060004": "The recovery link is invalid or has already been used. Please start account recovery again.",
        "4060005": "The recovery page was open too long and has been refreshed. Please try again.",
        "4060006": "The code is invalid or has already been used. Check it and try again, or resend the code.",
        "4070001": "The verification link is invalid or has already been used. Please send a new verification email.",
        "4070002": "This verification has already been completed and can't be submitted again.",
        "4070003": "Verification ran into a problem. Please start over.",
        "4070004": "The link is missing its verification token. Please send a new verification email.",
        "4070005": "The verification page was open too long and has been refreshed. Please try again.",
        "4070006": "The code is invalid or has already been used. Check it and try again, or resend the code.",
        "5000001": "The sign-in service ran into an internal error. Please try again later.",
        "5000002": "No sign-in methods are available. Please contact the administrator.",
        "5000003": "Your organization requires single sign-on, but none is configured. Please contact the administrator."
      },
      "variants": {
        "requiredField": "Please enter your {field}.",
        "duplicateIdentifierUnknown": "This email",
        "duplicateMethods": "You can sign in with {methods}.",
        "duplicateProviders": "You can also sign in with: {providers}.",
        "lookupSecretUsed": "Used"
      },
      "fields": {
        "identifier": "email",
        "email": "email",
        "traits_email": "email",
        "name": "username",
        "traits_name": "username",
        "password": "password",
        "code": "verification code",
        "totp_code": "authentication code",
        "lookup_secret": "backup recovery code",
        "webauthn_register_displayname": "security key name"
      },
      "credentialTypes": {
        "password": "your password",
        "oidc": "a social account",
        "saml": "a social account",
        "webauthn": "a passkey or security key",
        "passkey": "a passkey",
        "code": "an email code"
      },
      "reasons": {
        "tooManyAttempts": "Too many attempts, so this code no longer works. Please request a new code.",
        "codeUsed": "This code has already been used. Please request a new one.",
        "invalidEmail": "The email address is not valid. Please check it and try again.",
        "invalidFormat": "The format is not valid. Please check it and try again.",
        "oidcDenied": "You cancelled the sign-in with the social account. Choose a sign-in method to try again.",
        "oidcProviderError": "The social account provider returned an error. Please try again or use another sign-in method.",
        "oidcFailed": "Signing in with the social account didn't finish. Please try again.",
        "oidcPermissions": "The social account didn't grant the permissions we need. Please try again and accept all permissions.",
        "sessionCookieInvalid": "Your sign-in state is invalid. Please try again; if it keeps happening, clear this site's cookies.",
        "webauthnFailed": "The response from your passkey or security key couldn't be read. Please try again.",
        "credentialMissing": "The key you tried to remove no longer exists. Please reload the page.",
        "lastCredential": "This is your only sign-in method and can't be removed. Add another sign-in method first.",
        "noChanges": "There are no changes to save.",
        "lookupRegenerateFirst": "Generate new backup recovery codes before confirming them.",
        "lookupNone": "You don't have any backup recovery codes yet.",
        "addressNotVerified": "This account's email address is not verified yet. Please check your inbox and verify it first.",
        "alreadySignedIn": "You are already signed in.",
        "flowDisabled": "This feature is not available right now."
      },
      "errors": {
        "security_csrf_violation": "The security check failed, possibly because the page was open too long or used in several tabs at once. Please go back and start over; if it keeps happening, clear this site's cookies.",
        "security_identity_mismatch": "This request was started by a different account and was rejected. Please start over.",
        "session_already_available": "You are already signed in.",
        "session_aal_already_fulfilled": "You have already completed the required verification.",
        "session_aal1_required": "Please sign in before the second authentication step.",
        "session_aal2_required": "This action needs the second authentication step. Please sign in again and complete it.",
        "session_inactive": "Your session has ended. Please sign in again.",
        "session_refresh_required": "To keep your account safe, please verify it is you before changing these settings.",
        "session_verified_address_required": "Your email address is not verified yet. Please check your inbox and verify it first.",
        "self_service_flow_expired": "This page has expired. Please go back and start over.",
        "self_service_flow_disabled": "This feature is not available right now.",
        "self_service_flow_replaced": "This page was replaced by a newer request. Please go back and start over.",
        "self_service_flow_return_to_forbidden": "The redirect target is not allowed, so it was not followed. Please go back and start over.",
        "browser_location_change_required": "Your browser needs to open another page to continue. Please try again.",
        "invalid_configuration": "The sign-in service is misconfigured and can't finish this right now. Please try again later or contact the administrator."
      },
      "errorStatus": {
        "400": "The request was not valid. Please go back to sign-in and start over.",
        "401": "Your session has ended. Please sign in again.",
        "403": "The request was rejected. Please go back to sign-in and start over.",
        "404": "What you were looking for doesn't exist or has expired. Please go back to sign-in and start over.",
        "410": "This page has expired. Please go back to sign-in and start over.",
        "500": "The sign-in service ran into an internal error. Please try again later."
      },
      "errorPage": {
        "technicalDetails": "Technical details (include them when reporting a problem)",
        "reasonLabel": "Reason"
      },
      "webauthn": {
        "unsupported": "This browser doesn't support passkeys or security keys. Please use a current version of Chrome, Edge, Safari or Firefox.",
        "notAllowed": "The request was cancelled or timed out. Please try again and confirm it in the system dialog.",
        "invalidState": "This passkey or security key has already been added.",
        "aborted": "The request was cancelled.",
        "security": "Passkeys can't be used on this address. Make sure you are on the site's official address.",
        "failed": "The passkey or security key request failed. Please try again."
      }
    },
    "toast": {
      "networkError": "Network error, please check your connection",
      "loginFailedTitle": "Sign-in failed",
      "accountBannedTitle": "Account banned",
      "permissionDenied": "Permission denied, please check account status",
      "tryLater": "Please try again later",
      "logoutSuccessTitle": "Signed out",
      "invalidReturnToTitle": "Sign-in flow restarted",
      "invalidReturnToDescription": "An unexpected return target was detected. A safe sign-in flow has been started.",
      "invalidRegistrationReturnToTitle": "Registration flow restarted",
      "invalidRegistrationReturnToDescription": "An unexpected return target was detected. A safe registration flow has been started."
    },
    "login": {
      "title": "Sign in to Haruki Toolbox",
      "description": "Use your email and password to sign in",
      "emailLabel": "Email",
      "emailPlaceholder": "Enter your email",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "forgotPassword": "Forgot password?",
      "submit": "Sign in",
      "noAccount": "No account yet?",
      "registerLink": "Register",
      "reasons": {
        "authRequired": "You need to sign in to view that page. You will be taken back to it after signing in.",
        "adminRequired": "That page needs an administrator account. You will be taken back to it after signing in.",
        "sessionExpired": "Your session has expired. Sign in again and you will be taken back to where you were."
      },
      "toast": {
        "enterEmail": "Please enter your email",
        "completeCaptcha": "Please complete CAPTCHA first",
        "completeLoginCaptcha": "Please complete CAPTCHA first",
        "resetEmailSentTitle": "Reset email sent",
        "resetEmailSentDescription": "Email has been sent to {email}",
        "resetFailedTitle": "Reset password failed",
        "loginSuccessTitle": "Sign-in successful",
        "loginSuccessDescription": "Welcome back to Haruki Toolbox"
      }
    },
    "register": {
      "title": "Register account",
      "description": "Create a new Haruki Toolbox account",
      "usernameLabel": "Username",
      "usernamePlaceholder": "Enter username",
      "emailLabel": "Email",
      "emailCodeLabel": "Email verification code",
      "emailCodePlaceholder": "Enter the code from your email",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter password",
      "sending": "Sending...",
      "countdown": "Retry in {seconds}s",
      "sendCode": "Send code",
      "submit": "Register",
      "hasAccount": "Already have an account?",
      "goLogin": "Sign in"
    },
    "resetPassword": {
      "title": "Reset password",
      "description": "Reset your Haruki Toolbox account password",
      "emailLabel": "Email",
      "newPasswordLabel": "New password",
      "newPasswordPlaceholder": "Enter new password",
      "confirmPasswordLabel": "Confirm password",
      "confirmPasswordPlaceholder": "Enter new password again",
      "submit": "Confirm reset"
    },
    "verification": {
      "title": "Verify email",
      "description": "Complete the identity verification flow to activate your current email address.",
      "submit": "Submit verification",
      "continue": "Continue"
    },
    "validation": {
      "required": "This field is required"
    },
    "password": {
      "show": "Show password",
      "hide": "Hide password"
    },
    "error": {
      "title": "Sign-in service problem",
      "description": "The sign-in service returned an error. Go back to the sign-in page and start again; if it keeps happening, try again later.",
      "retry": "Reload",
      "backToLogin": "Back to sign in",
      "missingIdDescription": "The link has no error ID, so the cause cannot be looked up. Go back to the sign-in page and start again.",
      "loadFailedDescription": "The error details could not be loaded. Check your connection and try again.",
      "fallbackDescription": "The sign-in service could not complete this step. Go back to the sign-in page and start again.",
      "errorIdLabel": "Error ID",
      "statusCodeLabel": "Status code",
      "detailsLabel": "Details"
    }
  },
  "sidebar": {
    "toggle": "Toggle sidebar",
    "title": "Navigation menu",
    "description": "Site navigation menu."
  },
  "sidebarUser": {
    "guestInitial": "?",
    "guestName": "Not signed in",
    "accountSettings": "Account settings",
    "identitySettings": "Sign-in & security",
    "gameAccountManagement": "Game account management",
    "harukiBotAuthorization": "HarukiBot data authorization",
    "oauthAuthorizations": "Authorized apps",
    "logout": "Sign out",
    "register": "Register",
    "login": "Sign in",
    "copyToolboxId": "Copy Toolbox user ID",
    "toolboxIdCopied": "Toolbox user ID copied",
    "copyFailed": "Copy failed"
  },
  "home": {
    "title": "Welcome to Haruki Toolbox",
    "description": "Choose the feature you need",
    "aboutBanner": {
      "badge": "About & Support",
      "title": "Your support is our motivation to keep going",
      "desc": "Click to view about Project Haruki and how to sponsor our dev team"
    },
    "accountAndSettings": "Account & Settings",
    "register": "Register",
    "login": "Sign in",
    "accountSettings": "Account settings",
    "gameAccountManagement": "Game account management",
    "moreLinks": "More",
    "accountCard": {
      "title": "My account",
      "dataUpdatedAt": "Data uploaded at {time}",
      "noUploadData": "This account has not uploaded any data yet",
      "guestDescription": "Sign in and bind a game account to upload data, view your profile and unlock personalized features.",
      "onboarding": {
        "title": "Three steps to start",
        "step1": "Register and sign in",
        "step2": "Bind and verify your game account under \"{link}\"",
        "step2Link": "Game account management",
        "step3": "{link} your game data once with the iOS module / HarukiProxy",
        "step3Link": "Upload",
        "outro": "After that you can browse your cards, event records, deck recommendations and more."
      }
    },
    "externalLinks": "External links",
    "harukiBotDocs": "HarukiBot NEO docs",
    "harukiGithub": "Haruki GitHub",
    "legalLinks": "Legal",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "currentEvent": {
      "title": "Current event ({region})",
      "optInHint": "Load the game database to show the ongoing event.",
      "load": "Load current event",
      "none": "No event is currently running.",
      "error": "Failed to load event info.",
      "ended": "Ended",
      "remainingDays": "{days}d {hours}h remaining",
      "remainingHours": "{hours}h {minutes}m remaining",
      "remainingMinutes": "{minutes}m remaining",
      "badge": "Live now",
      "links": {
        "rankBorder": "Border lines",
        "deckRecommend": "Deck",
        "detail": "Details"
      }
    }
  },
  "gameAccountSelect": {
    "placeholder": "Select a game account",
    "verified": "Verified",
    "default": "Default",
    "none": "No game account is bound to your profile yet.",
    "manage": "Manage bindings",
    "grantedBadge": "Granted",
    "groups": {
      "own": "My bound accounts",
      "granted": "Granted to me"
    }
  },
  "cardBox": {
    "title": "My Cards",
    "description": "View your game account's card collection progress",
    "entryLink": "My Cards",
    "noAccountHint": "Bind and select a game account to view your cards.",
    "refresh": "Refresh",
    "loadError": "Failed to load your card collection data",
    "retry": "Retry",
    "unknownCharacter": "Unknown character",
    "empty": "No cards match the current view.",
    "total": "{total} cards",
    "summary": "{owned}/{total} collected · {percent}%",
    "nav": {
      "label": "Jump to character"
    },
    "sections": {
      "collapseAll": "Collapse all",
      "expandAll": "Expand all"
    },
    "sort": {
      "id": "ID",
      "rarity": "Rarity",
      "level": "Level",
      "masterRank": "Master rank"
    },
    "group": {
      "label": "Group by",
      "character": "By character",
      "attr": "By attribute",
      "all": "All cards"
    },
    "ownership": {
      "label": "Show",
      "all": "All",
      "owned": "Owned",
      "missing": "Missing"
    },
    "stats": {
      "title": "Collection stats",
      "byUnit": "By unit",
      "byAttr": "By attribute",
      "byRarity": "By rarity",
      "ownedOfTotal": "{owned}/{total}",
      "percent": "{percent}%"
    },
    "badge": {
      "level": "Lv.{level}"
    }
  },
  "eventRecords": {
    "title": "Event Records",
    "description": "View your game account's event participation records",
    "idle": "Select a game account to view your event records.",
    "loading": "Loading uploaded data and event data…",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view event records.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now.",
    "uploadData": "Upload game data",
    "noData": "Your uploaded data has no event records yet.",
    "noMatches": "No event records match the current filters.",
    "hiddenByTime": "No event records in the last year; {count} older records are hidden",
    "showAll": "Show all",
    "loadFailed": "Failed to load event records.",
    "retry": "Retry",
    "refresh": "Refresh",
    "summary": {
      "bestRank": "Best rank",
      "ranked": "Ranked events",
      "participated": "Events participated",
      "bestPoint": "Best event PT",
      "averagePoint": "Average event PT"
    },
    "filters": {
      "time": "Time",
      "lastYear": "Past year",
      "all": "All",
      "custom": "Custom",
      "from": "From",
      "to": "To",
      "type": "Event type"
    },
    "trend": {
      "title": "Event PT trend",
      "empty": "Not enough records to draw a trend yet.",
      "point": "Event PT",
      "rank": "Event rank",
      "showAll": "Show all",
      "zoomHint": "Drag or resize the selection below to focus on a range of events"
    },
    "sort": {
      "time": "Date",
      "point": "Event PT",
      "rank": "Rank"
    },
    "table": {
      "count": "{count} events",
      "title": "Event history",
      "event": "Event",
      "type": "Type",
      "point": "Event PT",
      "rank": "Rank",
      "rankFromHonor": "No exact rank data; tier derived from the event honor"
    },
    "worldLink": {
      "chapters": "{count} chapters",
      "showChapters": "Show chapters",
      "hideChapters": "Hide chapters",
      "chapterLabel": "Chapter {no}",
      "finale": "Finale"
    }
  },
  "musicProgress": {
    "title": "Music progress",
    "description": "View your game account's music play progress and claimable rewards",
    "rewards": {
      "title": "Obtainable rewards",
      "hint": "Unclaimed song achievement rewards (score ranks + per-difficulty combo milestones); any live mode counts.",
      "unavailable": "Your uploaded data has no song achievement claim records, so obtainable rewards cannot be counted. Upload a complete data set again and retry.",
      "jewel": "Crystals",
      "coin": "Coins",
      "shard": "Shards",
      "scoreRank": "Score rank",
      "allClaimed": "All claimed"
    },
    "scoreRank": {
      "title": "Score rank rewards by song",
      "description": "Score rank is progressive (C → B → A → S): each song has one current rank, and reaching a higher rank also pays the lower ones. Any live mode (solo, multi, ...) counts. The current rank follows the achievement records in your uploaded data.",
      "summary": "Obtained: {obtained} · Remaining: {remaining} · {complete} / {total} songs complete",
      "none": "none",
      "filter": {
        "label": "Show",
        "all": "All",
        "remaining": "Incomplete",
        "none": "No rank"
      },
      "sort": {
        "label": "Sort",
        "remaining": "Remaining crystals",
        "music": "Song order",
        "rank": "Current rank"
      },
      "visible": "Showing {shown} / {total} songs",
      "current": "Current rank {rank}",
      "currentNone": "No rank reached yet",
      "step": "Rank {rank}: {rewards}",
      "stepReached": "Rank {rank}: {rewards} (reached)",
      "complete": "Complete",
      "empty": "No songs match.",
      "showMore": "Show more ({count} left)"
    },
    "refresh": "Refresh",
    "retry": "Retry",
    "noAccount": "Select or bind a game account to view your play progress.",
    "loading": "Loading uploaded data and music data…",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view music progress.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now.",
    "uploadData": "Upload game data",
    "noResults": "Your uploaded data has no music play results yet; all songs are shown as unplayed.",
    "suiteError": "Failed to load music progress.",
    "downloading": "Downloading game database ({progress}%)...",
    "overallTitle": "All difficulties",
    "levelsTitle": "Progress by level",
    "noSongs": "No songs exist for this difficulty on the selected server.",
    "level": "Lv.{level}",
    "levelUnknown": "Lv.?",
    "songCount": "{count} songs",
    "songFilter": {
      "label": "Show",
      "all": "All",
      "notAllPerfect": "Not AP",
      "notFullCombo": "Not FC",
      "notCleared": "Not cleared"
    },
    "sections": {
      "collapseAll": "Collapse all",
      "expandAll": "Expand all"
    },
    "matchCount": "{count} / {total} songs",
    "noMatches": "No songs match in this level.",
    "rewardsRemaining": "Remaining: {list}",
    "detailSummary": "{total} songs · {cleared} cleared · {fullCombo} FC · {allPerfect} AP",
    "legend": {
      "allPerfect": "All perfect",
      "fullCombo": "Full combo (no AP)",
      "clear": "Clear (no FC)",
      "unplayed": "Unplayed"
    },
    "status": {
      "allPerfect": "AP",
      "fullCombo": "FC",
      "clear": "CLEAR",
      "unplayed": "—"
    }
  },
  "globalSearch": {
    "title": "Quick search",
    "description": "Search music, cards, and events from the local game database",
    "placeholder": "Search music, cards, events...",
    "typeToSearch": "Type to search music, cards, and events",
    "error": "Failed to load the game database",
    "retry": "Retry",
    "empty": "No results found",
    "groups": {
      "music": "Music",
      "card": "Cards",
      "event": "Events"
    },
    "footerRegion": "Data region: {region}",
    "footerHint": "{shortcut} to toggle search"
  },
  "costumes": {
    "dressup": {
      "title": "Costume Dressup",
      "description": "Mix and match character costumes, accessories and hairstyles in 3D",
      "region": "Server",
      "character": "Character",
      "characterPlaceholder": "Select a character",
      "body": "Costume",
      "head": "Accessory",
      "hair": "Hairstyle",
      "partPlaceholder": "Select a part",
      "searchPlaceholder": "Search by name or ID...",
      "empty": "No matches found.",
      "hairLockedHint": "This accessory has a fixed hairstyle, so the hairstyle slot has no effect.",
      "reset": "Reset to defaults",
      "rotateLeft": "Turn left",
      "rotateRight": "Turn right",
      "resetView": "Face front",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "copyLink": "Copy link",
      "linkCopied": "Link copied",
      "colorCount": "{count} colors",
      "linkCopyFailed": "Could not copy. Copy the address bar instead.",
      "loadError": "Failed to load costume data.",
      "roleLoadError": "Failed to load the character's 3D part list.",
      "retry": "Retry"
    },
    "viewer": {
      "loadError": "Failed to load the 3D model.",
      "retry": "Retry",
      "idle": "Select a costume to preview."
    }
  },
  "gachas": {
    "common": {
      "region": "Region",
      "loadError": "Failed to load gacha data",
      "retry": "Retry",
      "dateFallback": "TBA"
    },
    "type": {
      "ceil": "Spark Gacha",
      "normal": "Regular",
      "beginner": "Beginner",
      "sunormal": "Bonus Paid Gacha",
      "subeginner": "Bonus Beginner Gacha",
      "return": "Comeback",
      "unknown": "Other"
    },
    "list": {
      "title": "Gacha catalog",
      "description": "Browse Project Sekai gacha banners and rates",
      "searchPlaceholder": "Search by name or ID...",
      "typeLabel": "Type",
      "allTypes": "All types",
      "statusLabel": "Status",
      "allStatuses": "All statuses",
      "yearLabel": "Year",
      "allYears": "All years",
      "cardLabel": "Featuring card",
      "allCards": "All cards",
      "cardSearchPlaceholder": "Search by card name or ID...",
      "cardEmpty": "No cards found.",
      "removeCardFilter": "Remove card filter",
      "sortLabel": "Sort",
      "filtersTitle": "Filters",
      "resetFilters": "Reset filters",
      "total": "{total} gachas",
      "empty": "No gachas match the current filters"
    },
    "detail": {
      "back": "Back to gachas",
      "notFound": "This gacha (#{gachaId}) is not in the current server's data. Try another server.",
      "pickups": "Pickup members",
      "poolCards": "All cards in pool",
      "rates": "Rates",
      "rarity": "Rarity",
      "cardCount": "Cards",
      "baseRate": "Base rate",
      "guaranteedRate": "Guaranteed slot",
      "guaranteedNote": "The 10th pull of a 10-pull guarantees a {rarity} or higher member.",
      "behaviors": "Pull options",
      "behaviorType": "Type",
      "spinCount": "Pulls",
      "cost": "Cost",
      "executeLimit": "Limit",
      "colorfulPass": "Colorful Pass",
      "ceilItem": "Exchange sticker",
      "summary": "Summary",
      "description": "Details"
    },
    "rarity": {
      "rarity_1": "★1",
      "rarity_2": "★2",
      "rarity_3": "★3",
      "rarity_4": "★4",
      "rarity_birthday": "Birthday"
    },
    "behaviorType": {
      "normal": "Normal pull",
      "over_rarity_3_once": "★3+ guaranteed once",
      "over_rarity_4_once": "★4 guaranteed once",
      "once_a_day": "Once a day",
      "once_a_week": "Once a week"
    },
    "costResource": {
      "jewel": "Crystals",
      "paid_jewel": "Paid crystals",
      "gacha_ticket": "Gacha ticket"
    }
  },
  "playerProfile": {
    "title": "My Profile",
    "description": "View your game account's profile",
    "source": {
      "realtime": "Live data",
      "snapshot": "Uploaded data"
    },
    "noAccountHint": "Bind and select a game account to view your profile.",
    "loadError": "Failed to load profile data.",
    "retry": "Retry",
    "refresh": "Refresh",
    "realtimeAsOf": "Live data updated at {time}",
    "unknownCharacter": "Unknown character",
    "stats": {
      "title": "Play stats"
    },
    "snapshotNote": "From uploaded data · uploaded at {time}",
    "unitAverage": "Unit averages",
    "header": {
      "title": "Basic Info",
      "rank": "Lv.{rank}",
      "gameId": "Game ID",
      "copy": "Copy game ID",
      "copied": "Game ID copied",
      "copyFailed": "Copy failed"
    },
    "deck": {
      "title": "Current Deck",
      "empty": "No active deck data"
    },
    "badge": {
      "level": "Lv.{level}"
    },
    "music": {
      "title": "Music Clear Stats"
    },
    "multiLive": {
      "title": "Multi Live",
      "mvp": "MVP count",
      "superStar": "Super Star count"
    },
    "characters": {
      "title": "Character Levels",
      "rank": "Rank {rank}",
      "empty": "No character data"
    },
    "challenge": {
      "title": "Challenge Live",
      "summary": "Best score: {name} · {score}",
      "empty": "No challenge live records yet"
    },
    "links": {
      "eventRecords": "Event records",
      "characterMissions": "Character missions",
      "challengeDetail": "Challenge details"
    },
    "collection": {
      "title": "Card Collection by Character",
      "summary": "{owned}/{total} collected · {percent}%",
      "empty": "No card data yet"
    }
  },
  "training": {
    "layout": {
      "title": "Character training",
      "description": "View your game account's training progress",
      "refresh": "Refresh"
    },
    "tabs": {
      "challenge": "Challenge Live",
      "power": "Power bonuses",
      "area": "Area items",
      "bonds": "Bonds",
      "leader": "Leader counts",
      "missions": "Missions"
    },
    "challenge": {
      "title": "Challenge Live",
      "description": "Challenge Live ranks and best scores per character",
      "noAccountHint": "Bind and select a game account to view challenge live info.",
      "loadError": "Failed to load challenge live data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "summary": "Best: {name} · {score}",
      "charactersWithData": "Characters played: {count} / {total}",
      "empty": "No challenge live records yet",
      "sortByCharacter": "By character",
      "sortByScore": "By score",
      "scoreLabel": "Score",
      "stageLabel": "Challenge Stage",
      "unclaimedLabel": "Claimable rewards",
      "jewel": "Crystals ×{count}",
      "shard": "Crystal shards ×{count}",
      "allClaimed": "All rewards claimed"
    },
    "power": {
      "title": "Power bonuses",
      "description": "The account's power bonus breakdown",
      "noAccountHint": "Bind and select a game account to view power bonuses.",
      "loadError": "Failed to load power bonus data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "sharedAreaTitle": "Area items for all characters",
      "allCharacterBonus": "All-character base bonus",
      "multiUnitBonus": "Conditional multi-unit bonus",
      "sharedAreaHint": "The base bonus is included in the character bonuses below. The multi-unit bonus is listed separately; its activation and stacking with unit bonuses depend on the actual deck.",
      "charactersTitle": "Character Bonuses",
      "unitsTitle": "Unit Bonuses",
      "attrsTitle": "Attribute Bonuses",
      "rankBonus": "Rank",
      "areaItemBonus": "Area item",
      "fixtureBonus": "MYSEKAI fixtures",
      "gateBonus": "MYSEKAI gate",
      "gateHint": "The VIRTUAL SINGER gate bonus assumes no support unit and uses the highest owned gate level. Cards with a support unit use that unit’s gate.",
      "units": {
        "light_sound": "Leo/need",
        "idol": "MORE MORE JUMP!",
        "street": "Vivid BAD SQUAD",
        "theme_park": "Wonderlands×Showtime",
        "school_refusal": "Nightcord at 25:00",
        "piapro": "VIRTUAL SINGER"
      },
      "attrs": {
        "cute": "Cute",
        "cool": "Cool",
        "pure": "Pure",
        "happy": "Happy",
        "mysterious": "Mysterious"
      }
    },
    "bonds": {
      "title": "Bonds",
      "description": "The account's character bonds",
      "noAccountHint": "Bind and select a game account to view bonds.",
      "loadError": "Failed to load bond data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "filterLabel": "Character",
      "filterAll": "All characters",
      "count": "{count} pairs",
      "level": "Bond Lv.{level}",
      "charaRank": "Rank {rank}",
      "needExp": "{exp} EXP to next level",
      "maxLevel": "MAX level",
      "notOwned": "Not unlocked",
      "empty": "No bond data yet",
      "showRewards": "Show level rewards",
      "rewardsTitle": "Rewards by level (reached levels dimmed)",
      "rewards": {
        "jewel": "Crystals ×{count}",
        "material": "{name} ×{count}",
        "materialFallback": "Material ×{count}",
        "bondsHonor": "Bonds plaque Lv.{level}",
        "bondsHonorWord": "Plaque words",
        "stamp": "Stamp",
        "boostItem": "Boost item ×{count}",
        "cutInVoice": "Cut-in voice",
        "other": "Reward"
      }
    },
    "area": {
      "title": "Area Items",
      "description": "Area item level progress and upgrade materials",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load area item data",
      "noAccountHint": "Bind and select a game account to view area items",
      "empty": "No area items match the current filters",
      "filters": {
        "unit": "Unit",
        "attr": "Attribute",
        "character": "Character",
        "tree": "Tree",
        "flower": "Flower",
        "allCharacters": "All characters",
        "special": "Other",
        "all": "All"
      },
      "level": "Lv.{level}",
      "bonus": "+{bonus}%",
      "multiUnitTarget": "Multi-unit deck",
      "multiUnitBonus": "Conditional multi-unit bonus +{bonus}%",
      "maxed": "All released levels reached",
      "notInShop": "Not available in the shop yet",
      "canUpgrade": "Ready to upgrade",
      "nextLevel": "Next level",
      "nextBonus": "Next bonus",
      "showAll": "All levels"
    },
    "leader": {
      "title": "Leader counts",
      "description": "Cumulative leader play counts per character",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load leader statistics",
      "noAccountHint": "Bind and select a game account to view leader statistics",
      "limit": "Mission cap {count}",
      "sortByTotal": "By count",
      "sortByCharacter": "By character",
      "normalLabel": "Normal",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "Unknown character"
    },
    "missions": {
      "title": "Character Missions",
      "description": "Character mission progress and projected character levels",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load character mission data",
      "noAccountHint": "Bind and select a game account to view character missions",
      "empty": "No character mission data",
      "character": "Character",
      "unknownCharacter": "Character {id}",
      "rank": "Lv.{rank}",
      "currentExp": "Current EXP",
      "pendingExp": "Pending EXP",
      "projected": "After claiming",
      "projectedValue": "Lv.{level} ({exp} EXP)",
      "basicGroup": "Collection missions",
      "achievementGroup": "Achievement missions",
      "exRound": "EX round {round}",
      "types": {
        "play_live": "Leader plays",
        "play_live_ex": "Leader plays (EX)",
        "waiting_room": "Waiting room",
        "waiting_room_ex": "Waiting room (EX)",
        "collect_costume_3d": "Costumes",
        "collect_stamp": "Stamps",
        "read_area_talk": "Area conversations",
        "read_card_episode_first": "Card episodes (part 1)",
        "read_card_episode_second": "Card episodes (part 2)",
        "collect_another_vocal": "Another Vocal",
        "area_item_level_up_all_character": "Level up the area item for all characters",
        "area_item_level_up_character": "Character item upgrades",
        "area_item_level_up_unit": "Unit item upgrades",
        "area_item_level_up_reality_world": "Attribute item (tree & flower) upgrades",
        "collect_member": "Cards",
        "skill_level_up_rare": "Skill level ups (4★ & birthday)",
        "skill_level_up_standard": "Skill level ups (1★-3★)",
        "master_rank_up_rare": "Master rank ups (4★ & birthday)",
        "master_rank_up_standard": "Master rank ups (1★-3★)",
        "collect_character_archive_voice": "Voice lines",
        "collect_mysekai_fixture": "MySekai furniture",
        "collect_mysekai_canvas": "MySekai canvases",
        "read_mysekai_fixture_unique_character_talk": "MySekai conversations"
      }
    }
  },
  "searchAlias": {
    "badge": "Alias"
  },
  "sekaiRegion": {
    "followAccount": "Follow current account",
    "followAccountResolved": "Follow current account ({region})",
    "followBadge": "Following",
    "labels": {
      "jp": "JP",
      "en": "Global",
      "tw": "TW",
      "kr": "KR",
      "cn": "CN"
    }
  },
  "sekaiUnreleased": {
    "badge": "Unreleased"
  },
  "navigation": {
    "groups": {
      "recommendAndAbout": "Recommended & About",
      "friendshipRecommendation": "Friend recommendations",
      "eventRankingTools": "Event Ranking Tools",
      "projectSekai": "Project SEKAI Tools",
      "accountManagement": "Account & Management",
      "harukiBot": "HarukiBot",
      "sekaiCatalog": "Sekai catalog",
      "sekaiPlayer": "My game data"
    },
    "items": {
      "friendGroups": "Recommended groups",
      "friendLinks": "Friend links",
      "sponsors": "Sponsors",
      "deckRecommend": "Deck recommend",
      "eventPlanner": "Event planner",
      "rankBorder": "Rank border",
      "about": "About",
      "ptCalculator": "Score control",
      "uploadData": "Data upload",
      "sekaiStation": "Sekai Station",
      "botNeoRegistration": "HarukiBot NEO registration",
      "musicLibrary": "Music catalog",
      "cards": "Card catalog",
      "events": "Event catalog",
      "cardBox": "My Cards",
      "eventRecords": "Event records",
      "musicProgress": "Music progress",
      "gachas": "Gacha catalog",
      "costumes": "Costume dressup",
      "storyPlayer": "Story player",
      "playerProfile": "My profile",
      "training": "Character training"
    },
    "notFound": {
      "title": "Page not found",
      "description": "The address you visited doesn't exist or has been moved. Please check that the link is correct.",
      "backHome": "Back to home",
      "backPrevious": "Go back"
    }
  },
  "webLayout": {
    "nav": {
      "home": "Home",
      "harukiBotGroup": "HarukiBot",
      "admin": "Admin",
      "myTickets": "My tickets",
      "pendingTicketReplies": "{total} tickets awaiting your reply",
      "settings": "Settings"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. All rights reserved.",
      "privacyPolicy": "Privacy Policy",
      "termsOfService": "Terms of Service",
      "legalLinks": "Legal links",
      "unofficialNotice": "Haruki Toolbox is not affiliated with, authorized by, endorsed by, or officially partnered with SEGA / Colorful Palette.",
      "assetCopyright": "Related game assets are copyright SEGA / Colorful Palette.",
      "appVersion": "App version",
      "version": "Version",
      "gitCommit": "Git commit",
      "buildTime": "Build time"
    }
  },
  "route": {
    "sponsorFrames": "Supporter frames",
    "afdianCallback": "Afdian authorization",
    "home": "Home",
    "notFound": "Page not found",
    "settings": "Settings",
    "privacy": "Privacy Policy",
    "tos": "Terms of Service",
    "about": "About",
    "friendGroups": "Recommended groups",
    "friendLinks": "Friend links",
    "sponsors": "Sponsors",
    "deckRecommend": "Deck recommend",
    "rankBorder": "Rank border",
    "rankBorderDetail": "Rank border detail",
    "ptCalculator": "Event Pt calculator",
    "clientConfigGenerator": "Client config generator",
    "uploadData": "Upload data",
    "sekaiStation": "Sekai Station",
    "botNeoRegistration": "HarukiBot NEO registration",
    "login": "Sign in",
    "register": "Register",
    "verification": "Verify email",
    "resetPassword": "Reset password",
    "error": "Identity error",
    "userSettings": "Account settings",
    "userIdentitySettings": "Sign-in & security",
    "userIdentityProfileSettings": "Profile settings",
    "userIdentityPasswordSettings": "Change password",
    "userIdentityMfaSettings": "MFA settings",
    "userIdentitySocialSettings": "Social login settings",
    "userIdentitySessionSettings": "Signed-in devices",
    "gameAccountBindings": "Game account bindings",
    "harukiBotAuthorization": "HarukiBot data authorization",
    "oauthAuthorizations": "Authorized apps",
    "oauthLogin": "Continue sign in",
    "oauthConsent": "Authorize app",
    "oauthLogout": "Confirm sign out",
    "oauthDevice": "Authorize device",
    "tickets": {
      "mine": "My tickets",
      "create": "Create ticket",
      "detail": "Ticket detail"
    },
    "musicLibrary": {
      "list": "Music library",
      "detail": "Music detail",
      "progress": "Music progress"
    },
    "cards": {
      "list": "Card catalog",
      "detail": "Card detail",
      "box": "My Cards"
    },
    "events": {
      "list": "Event catalog",
      "detail": "Event detail",
      "records": "Event records"
    },
    "gachas": {
      "list": "Gacha catalog",
      "detail": "Gacha detail"
    },
    "costumes": {
      "dressup": "Costume Dressup"
    },
    "story": {
      "player": "Story player"
    },
    "playerProfile": {
      "me": "My profile"
    },
    "training": {
      "challenge": "Challenge Live details",
      "power": "Power bonuses",
      "area": "Area items",
      "bonds": "Bonds",
      "leader": "Leader counts",
      "missions": "Character missions"
    },
    "eventPlanner": {
      "planner": "Event planner"
    },
    "admin": {
      "layout": "Admin",
      "dashboard": "Dashboard",
      "users": "User management",
      "userDetail": "User detail",
      "oauthClients": "OAuth client management",
      "webhooks": "Webhook management",
      "logs": "System logs",
      "uploadLogs": "Upload logs",
      "content": "Content management",
      "sponsors": "Sponsor management",
      "config": "System config",
      "gameBindings": "Game binding management",
      "risk": "Risk management",
      "botSecurity": "Bot security alerts",
      "tickets": "Ticket management"
    }
  },
  "musicLibrary": {
    "eventBox": {
      "short": "{name} · Box {count}",
      "title": "Event song from {name}'s box #{count}"
    },
    "list": {
      "title": "Music library",
      "description": "Browse the PJSK music catalog: search, filter by difficulty, level, note count, unit and year.",
      "filters": {
        "region": "Server",
        "search": "Search",
        "searchPlaceholder": "Search by title or alias...",
        "searchPlaceholderNoAlias": "Search by title...",
        "title": "Filters",
        "difficulty": "Difficulty",
        "difficultyAll": "All difficulties",
        "level": "Level range",
        "levelMin": "Min",
        "levelMax": "Max",
        "noteCount": "Note count",
        "noteCountMode": {
          "exact": "Exact",
          "range": "Range"
        },
        "noteCountExactPlaceholder": "e.g. 886",
        "noteCountMin": "Min",
        "noteCountMax": "Max",
        "tag": "Tags",
        "character": "Character",
        "characterAll": "All characters",
        "characterScope": {
          "any": "Any relation",
          "box": "Box songs",
          "vocal": "Vocal",
          "anotherVocal": "Another Vocal"
        },
        "year": "Year",
        "yearAll": "All years",
        "sort": "Sort by",
        "sortDirection": {
          "asc": "Ascending",
          "desc": "Descending"
        },
        "reset": "Reset filters"
      },
      "sort": {
        "publishedAt": "Release date",
        "level": "Level",
        "noteCount": "Note count",
        "title": "Title"
      },
      "results": {
        "count": "{count} songs",
        "empty": "No songs match the current filters.",
        "aliasSearching": "Matching aliases..."
      },
      "downloading": "Downloading game database... {progress}%",
      "loadError": "Failed to load music data: {message}",
      "unknownDate": "Unknown"
    },
    "difficulty": {
      "easy": "EASY",
      "normal": "NORMAL",
      "hard": "HARD",
      "expert": "EXPERT",
      "master": "MASTER",
      "append": "APPEND"
    },
    "tags": {
      "vocaloid": "VIRTUAL SINGER",
      "light_music_club": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands x Showtime",
      "school_refusal": "Nightcord at 25:00",
      "other": "Other",
      "event_box": "Box song",
      "world_link": "World Link"
    },
    "categories": {
      "mv": "3D MV",
      "mv_2d": "2D MV",
      "image": "Image",
      "original": "Original MV"
    },
    "vocalTypes": {
      "original_song": "Original",
      "sekai": "SEKAI ver.",
      "virtual_singer": "VIRTUAL SINGER ver.",
      "another_vocal": "Another Vocal",
      "instrumental": "Instrumental",
      "april_fool_2022": "April Fools 2022"
    },
    "detail": {
      "back": "Back to list",
      "notFound": "This song (#{musicId}) is not in the current server's data. Try another server.",
      "loadError": "Failed to load music data: {message}",
      "unknownCharacter": "Unknown",
      "aliases": {
        "title": "Aliases",
        "showMore": "{count} more",
        "showLess": "Show less"
      },
      "info": {
        "composer": "Composer",
        "lyricist": "Lyricist",
        "arranger": "Arranger",
        "publishedAt": "Released",
        "duration": "Duration",
        "bpm": "BPM",
        "id": "ID"
      },
      "difficultiesTitle": "Difficulties",
      "table": {
        "difficulty": "Difficulty",
        "level": "Level",
        "noteCount": "Notes"
      },
      "vocalsTitle": "Vocal versions",
      "vocalsEmpty": "No vocal versions available.",
      "play": "Play",
      "pause": "Pause",
      "chartPreview": {
        "title": "Chart Preview",
        "modeDynamic": "Dynamic",
        "modeStatic": "Static",
        "loadError": "Failed to load the chart.",
        "retry": "Retry",
        "seek": "Playback position",
        "speed": "Note speed",
        "zoomFit": "Fit height",
        "zoom": "Zoom level",
        "silent": "No audio found — the preview plays silently."
      },
      "eventsTitle": "Related events"
    }
  },
  "cards": {
    "common": {
      "region": "Server",
      "loadError": "Failed to load card data",
      "retry": "Retry"
    },
    "list": {
      "title": "Card catalog",
      "description": "Browse cards by character, unit, attribute, rarity and supply type",
      "searchPlaceholder": "Search card title…",
      "sortLabel": "Sort",
      "total": "{total} cards",
      "empty": "No cards match the current filters"
    },
    "filter": {
      "title": "Filters",
      "characters": "Characters",
      "units": "Unit",
      "attrs": "Attribute",
      "rarity": "Rarity",
      "supply": "Supply",
      "year": "Year",
      "yearAll": "All years",
      "clear": "Clear filters"
    },
    "sort": {
      "releaseDesc": "Newest first",
      "rarityDesc": "Rarity",
      "idAsc": "Card ID"
    },
    "unit": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "Nightcord at 25:00",
      "piapro": "VIRTUAL SINGER"
    },
    "attr": {
      "cute": "Cute",
      "cool": "Cool",
      "pure": "Pure",
      "happy": "Happy",
      "mysterious": "Mysterious"
    },
    "rarity": {
      "rarity_1": "1★",
      "rarity_2": "2★",
      "rarity_3": "3★",
      "rarity_4": "4★",
      "rarity_birthday": "Birthday"
    },
    "supply": {
      "normal": "Permanent",
      "birthday": "Birthday limited",
      "term_limited": "Limited",
      "colorful_festival_limited": "Colorful Fes limited",
      "bloom_festival_limited": "Bloom Fes limited",
      "unit_event_limited": "World Link event limited",
      "collaboration_limited": "Collab limited"
    },
    "detail": {
      "back": "Back to catalog",
      "notFound": "This card (#{cardId}) is not in the current server's data. Try another server.",
      "artNormal": "Before training",
      "artTrained": "After training",
      "artLoadFailed": "Failed to load card art",
      "info": "Card info",
      "character": "Character",
      "unit": "Unit",
      "supportUnit": "Support unit",
      "attr": "Attribute",
      "rarity": "Rarity",
      "supply": "Supply type",
      "releaseAt": "Released",
      "gachaPhrase": "Gacha phrase",
      "skill": "Skill",
      "skillLevel": "Level",
      "skillValue": "Value",
      "skillDuration": "Duration",
      "skillBeforeTraining": "Before training",
      "skillAfterTraining": "After training",
      "noSkill": "No skill data",
      "relatedEvents": "Related events",
      "relatedEventsEmpty": "No related events.",
      "relatedGachas": "Related gachas",
      "relatedGachasEmpty": "No related gachas.",
      "costumes": "Costumes",
      "costumeDressup": "Costume dressup",
      "costumePreviewHint": "Click a costume thumbnail for a 3D preview.",
      "costumeSlot": {
        "body": "Outfit",
        "hair": "Hairstyle",
        "head": "Headwear"
      },
      "sameCharacter": "More cards of this character"
    }
  },
  "events": {
    "common": {
      "dateFallback": "—",
      "idLabel": "ID {id}"
    },
    "type": {
      "marathon": "Marathon",
      "cheerful_carnival": "Cheerful Carnival",
      "world_bloom": "World Link",
      "unknown": "Unknown type"
    },
    "attr": {
      "cute": "Cute",
      "cool": "Cool",
      "pure": "Pure",
      "happy": "Happy",
      "mysterious": "Mysterious"
    },
    "list": {
      "title": "Event catalog",
      "description": "Browse Project SEKAI events, bonuses, and event cards.",
      "regionLabel": "Server",
      "searchLabel": "Search",
      "searchPlaceholder": "Search by event name or ID",
      "typeLabel": "Event type",
      "attrLabel": "Bonus attribute",
      "yearLabel": "Year",
      "allTypes": "All types",
      "allAttrs": "All attributes",
      "allYears": "All years",
      "filtersTitle": "Filters",
      "resultsCount": "{count} events",
      "resetFilters": "Reset filters",
      "loadFailed": "Failed to load event data.",
      "retry": "Retry",
      "empty": "No events match the current filters."
    },
    "detail": {
      "back": "Back to event catalog",
      "loadFailed": "Failed to load event data.",
      "retry": "Retry",
      "notFound": "This event (#{eventId}) is not in the current server's data. Try another server.",
      "timelineTitle": "Timeline",
      "timeline": {
        "start": "Starts",
        "aggregate": "Aggregates",
        "closed": "Closes"
      },
      "countdownToStart": "Starts in",
      "countdownToAggregate": "Aggregates in",
      "countdownValue": "{days}d {hours}h {minutes}m {seconds}s",
      "bonusTitle": "Event bonus",
      "bonusEmpty": "No bonus data for this event.",
      "bonusAttrOnly": "All {attr} cards",
      "chaptersTitle": "World Link chapters",
      "chapterLabel": "Chapter {no}",
      "chapterFinale": "Finale",
      "cardsTitle": "Event cards",
      "cardsEmpty": "No cards for this event.",
      "links": {
        "rankBorder": "View rank border",
        "deckRecommend": "Event deck recommend",
        "story": "Play story"
      }
    }
  },
  "homeSettings": {
    "title": "Haruki Toolbox Settings",
    "description": "Configure the server route, image loading route, appearance, language, and performance preferences",
    "trigger": "Settings",
    "tabs": {
      "preferences": "Preferences",
      "app": "App",
      "sekaiData": "Game database",
      "userData": "User data"
    },
    "resetDialog": {
      "title": "Reset preferences?",
      "description": "This restores the server route, image loading route, appearance, language, low effects mode, and privacy preferences to their defaults.",
      "confirm": "Reset preferences"
    },
    "endpoint": {
      "label": "Server route",
      "help": "Direct is default. If international access is unstable, try CDN.",
      "placeholder": "Select a route",
      "direct": "Direct",
      "cdn": "CDN",
      "unavailable": "No server routes are configured in this environment.",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms",
      "refreshLatency": "Re-test latency"
    },
    "assetEndpoint": {
      "label": "Image loading route",
      "help": "Used for game assets such as card thumbnails. The first visit picks the lower-latency route, and opening settings re-checks them.",
      "placeholder": "Select a route",
      "global": "Recommended overseas",
      "chinaCdn": "China - Tencent Cloud CDN",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "Appearance",
      "help": "Choose your preferred theme",
      "placeholder": "Select theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "locale": {
      "label": "Language",
      "help": "Language changes apply immediately",
      "placeholder": "Select language",
      "zhCN": "简体中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "Low effects mode",
      "help": "Turns off glass blur, heavy shadows, and other costly visual effects. Useful on mobile or low-power devices."
    },
    "privacy": {
      "hideGameUserIdLabel": "Hide game UID",
      "hideGameUserIdHelp": "When enabled, account selectors for deck recommendation and uploads keep the first 2 and last 4 UID digits, replacing the middle with asterisks."
    },
    "unreleased": {
      "showLabel": "Show unreleased content",
      "showHelp": "When enabled, catalogs (cards, events, music, gachas) include content not yet released on the current server.",
      "blurLabel": "Spoiler blur for unreleased content",
      "blurHelp": "When unreleased content is shown, blur its card art, covers, and banners to avoid spoilers."
    },
    "appUpdate": {
      "title": "App update",
      "description": "Check for Haruki Toolbox version updates.",
      "current": "Current",
      "available": "Update available",
      "remoteVersion": "Remote version",
      "remoteCommit": "Remote Git commit",
      "remoteBuildTime": "Remote build time",
      "checkedAt": "Last checked: {time}",
      "lastError": "The last update check failed. Please try again later.",
      "notCheckedYet": "Updates have not been checked yet.",
      "check": "Check for updates",
      "checking": "Checking...",
      "update": "Update app",
      "updating": "Updating..."
    },
    "userData": {
      "description": "These are this browser's copies of the data your game accounts have uploaded. \"Refresh\" checks the server for a newer upload; \"Profile\" fetches the latest information straight from the game server.",
      "account": "Account",
      "accountPlaceholder": "Select a bound account",
      "noAccount": "No game account is bound to the current Toolbox account.",
      "dataType": "Data type",
      "types": {
        "suite": "Account data (Suite)",
        "mysekai": "MySekai data",
        "profile": "Profile"
      },
      "cacheUpdatedAt": "Local cache",
      "remoteUploadTime": "Upload time",
      "lastCheck": "Last check",
      "never": "No cache",
      "cacheHit": "Current",
      "cacheUpdated": "Updated",
      "notChecked": "Not checked",
      "refresh": "Refresh user data",
      "refreshing": "Refreshing...",
      "clear": "Clear user data cache",
      "clearDialog": {
        "title": "Clear user data cache?",
        "description": "This clears user data cached in this browser for the current Toolbox account. Data will need to be checked or downloaded again.",
        "confirm": "Clear cache"
      },
      "logoutCleanupHint": "Signing out automatically clears user data cached in this browser for the current Toolbox account.",
      "toast": {
        "alreadyCurrent": "User data is already current",
        "refreshed": "User data refreshed",
        "refreshFailed": "Failed to refresh user data",
        "cleared": "User data cache cleared",
        "clearFailed": "Failed to clear user data cache"
      }
    },
    "toast": {
      "reset": "Settings reset to defaults"
    },
    "sections": {
      "preferences": "Appearance, language, network, and privacy preferences. Changes apply immediately.",
      "sekaiData": "Manage per-region game database caches and background update jobs shared by pickers, recommendations, and other features."
    },
    "groups": {
      "appearance": "Appearance",
      "network": "Network",
      "privacy": "Privacy & content"
    }
  },
  "core": {
    "auth": {
      "sessionExpiredTitle": "Session expired",
      "sessionExpiredDescription": "Please sign in again",
      "accountBannedTitle": "Account banned",
      "permissionDeniedTitle": "Permission denied",
      "loginRequiredTitle": "Sign in required",
      "loginRequiredDescription": "You need to sign in to access this page",
      "requireAdminDescription": "Admin permission required",
      "requireSuperAdminDescription": "Super admin permission required",
      "apiRequestFailedTitle": "Request failed",
      "apiRequestFailedDescription": "The server could not handle this request right now. Try again later.",
      "permissionDeniedDescription": "You do not have permission to do this. If you think that is a mistake, contact an administrator.",
      "accountBannedDescription": "Your account has been banned and can no longer be used. Contact an administrator if you have questions.",
      "accountBannedWithReason": "Your account has been banned and can no longer be used. Reason: {reason}",
      "reauthRequired": "Password re-verification required"
    },
    "errors": {
      "network": "Network connection failed. Check your connection and try again.",
      "timeout": "The request timed out. Try again later.",
      "rateLimited": "Too many requests. Wait a moment and try again.",
      "serverUnavailable": "The server is temporarily unavailable. Try again later (code {status}).",
      "detail": "Details: {detail}"
    },
    "loadError": {
      "title": "Failed to load",
      "description": "Check your connection and try again. If it keeps failing, the service may be temporarily unavailable.",
      "retry": "Retry"
    },
    "sync": {
      "successTitle": "Settings synced",
      "successDescription": "Cloud settings are synced for current account",
      "failedTitle": "Settings sync unavailable",
      "failedDescription": "Cloud settings could not be synced. Try again later.",
      "missingUpdatedDataDescription": "The cloud settings response was incomplete. Refresh the page and try again.",
      "unexpectedStatusDescription": "Cloud settings request returned an unexpected status ({status})."
    },
    "suitePrefetch": {
      "progressTitle": "Fetching game data",
      "progressDescription": "{completed}/{total} bound accounts done",
      "successTitle": "Game data updated",
      "successDescription": "Updated game data for {updated}/{total} bound accounts",
      "partialTitle": "Game data failed to fetch for some accounts",
      "partialDescription": "{failed}/{total} accounts failed. They will retry automatically on the related pages.",
      "failedDescription": "Failed to fetch game data for bound accounts. It will retry automatically on the related pages."
    },
    "unsupportedBrowser": {
      "title": "Unsupported browser",
      "description": "You are trying to access Haruki Toolbox from an unsupported browser.",
      "suggestion": "Please use Chrome, Safari, Firefox, or another supported browser.",
      "deviceHint": "To authorize a device, copy the page address below, open it in your system browser, then type the code shown on your device.",
      "copyDeviceLink": "Copy page address",
      "copied": "Copied",
      "copyFailed": "Could not copy. Please type the address manually."
    },
    "pwa": {
      "updateAvailableTitle": "New version available",
      "updateAvailableDescription": "A new app build is ready. You can update now.",
      "updateAvailableDescriptionWithVersion": "New version {version} is ready to install.",
      "updateAction": "Update app",
      "laterAction": "Later",
      "applyingTitle": "Updating app",
      "applyingDescription": "The page will refresh after the update is applied.",
      "currentTitle": "App is up to date",
      "currentDescription": "The current app version is up to date.",
      "checkFailedTitle": "Update check failed",
      "checkFailedDescription": "Remote build information could not be loaded. Please try again later.",
      "offlineReadyTitle": "Offline cache ready",
      "offlineReadyDescription": "Common pages are cached, so the app opens faster next time.",
      "devTitle": "Development mode",
      "devDescription": "PWA updates are not registered in development mode.",
      "forcedUpdateTitle": "This version is no longer supported",
      "forcedUpdateDescription": "Updating to version {version}…",
      "forcedUpdateWithInputDescription": "The page reloads in a minute to update to version {version}. Copy anything you typed that you want to keep.",
      "chunkErrorTitle": "Part of the page failed to load",
      "chunkErrorDescription": "A new version was probably released. Reload the page to continue.",
      "reloadAction": "Reload page"
    }
  },
  "catalog": {
    "region": {
      "label": "Server"
    },
    "search": {
      "label": "Search",
      "clear": "Clear search"
    },
    "filters": {
      "title": "Filters",
      "reset": "Reset filters",
      "clearAll": "Clear all",
      "done": "Done",
      "sheetDescription": "Adjust the filters; the results update immediately.",
    },
    "results": {
      "count": "{count} results",
      "empty": "Nothing matches the current filters.",
      "emptyHint": "Try loosening the filters or switching server.",
      "loadError": "Failed to load data",
      "retry": "Retry",
      "downloading": "Downloading game data… {progress}%",
      "offline": "Offline data",
      "offlineHint": "Showing the locally cached game database; the latest content may not be synced yet"
    },
    "sort": {
      "label": "Sort",
      "asc": "Ascending",
      "desc": "Descending"
    },
    "view": {
      "label": "View",
      "grid": "Grid",
      "list": "List"
    },
    "pagination": {
      "label": "Pagination",
      "first": "First page",
      "prev": "Previous page",
      "next": "Next page",
      "last": "Last page",
      "page": "Page {page}",
      "pageOf": "{page} / {total}",
      "pageSize": "Items per page",
      "perPage": "{size} / page",
      "jump": "Jump to page",
      "summary": "{total} items · page {page} of {pages}"
    },
    "status": {
      "upcoming": "Upcoming",
      "ongoing": "Ongoing",
      "ended": "Ended",
      "upcomingHidden": "Upcoming content is hidden. Enable “show unreleased content” to see it.",
      "showUnreleased": "Show unreleased content",
      "endsIn": "{time} left",
      "startsIn": "Starts in {time}",
      "permanent": "Permanent"
    },
    "countdown": {
      "toStart": "Starts in",
      "toEnd": "Ends in",
      "toAggregate": "Aggregates in",
      "reached": "Reached",
      "days": "{days}d",
      "hours": "{hours}h",
      "minutes": "{minutes}m",
      "seconds": "{seconds}s"
    },
    "detail": {
      "backToList": "Back to {list}",
      "breadcrumb": "Breadcrumb",
      "notFound": "This entry is not in the current server's data. Try another server.",
      "loadError": "Failed to load details",
      "assetName": "Internal name",
      "period": "Period",
      "viewAllCount": "View all ({count})",
      "zoom": "Click to enlarge",
      "showMore": "Show more",
      "showLess": "Show less",
      "tryOtherRegion": "It may exist on another server; switching reloads the data."
    },
    "lightbox": {
      "description": "Image preview",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "openInNewTab": "Open in new tab",
      "items": "Images",
      "touchZoom": "Double-tap to zoom",
      "touchSwipe": "Swipe to switch images"
    },
    "time": {
      "localLabel": "Local time",
      "serverTime": "{region} server time: {time}",
      "hint": "Times are shown in your time zone ({zone}); where it differs, the {region} server time ({serverZone}) is noted next to each.",
      "sameZone": "Your time zone ({zone}) matches the {region} server."
    },
    "character": {
      "label": "Characters",
      "toggleUnit": "Toggle all members of {unit}"
    },
    "unit": {
      "label": "Units"
    },
    "attr": {
      "label": "Attributes"
    },
    "rarity": {
      "label": "Rarity"
    },
    "year": {
      "label": "Year",
      "all": "All years"
    },
    "type": {
      "label": "Type"
    },
    "statusFilter": {
      "label": "Status"
    }
  }
} as const
