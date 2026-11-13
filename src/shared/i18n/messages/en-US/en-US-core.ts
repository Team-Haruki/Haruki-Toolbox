// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: app, common, turnstile, auth, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, homeSettings, core, catalog
export default {
  "uploadedGameData": {
    "missingTitle": "Game data has not been uploaded",
    "missing": {
      "suite": "This game account has never uploaded its game data (Suite, the full account data). Upload it on the “Upload data” page first, then come back and refresh.",
      "mysekai": "This game account has never uploaded its MySekai data. Upload it on the “Upload data” page first, then come back and refresh.",
      "profile": "There is no data for this game account yet, so the realtime profile cannot be read. Upload game data once on the “Upload data” page, then come back and refresh."
    },
    "missingGranted": "The owner of this account has not uploaded any game data yet. Ask them to upload it; if they allowed you to upload on their behalf, you can do so on the “Upload data” page.",
    "uploadAction": "Go to the Upload data page",
    "uploadedAt": "Data uploaded at {time}",
    "grantLapsed": "Access to this account has expired or been revoked. Ask the owner to grant it again.",
    "refreshUpToDate": "Data is already up to date",
    "refreshUpdated": "Updated to {time}",
    "missingAccounts": "{count} bound accounts have no uploaded game data. Go to the Upload data page to upload it.",
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
    "showPassword": "Show password",
    "hidePassword": "Hide password",
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
    "forbidden": "You do not have permission to access this content. If you think that is a mistake, contact an administrator.",
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
    "granteeBanned": "The user you are trying to grant access to is banned, so access cannot be granted",
    "accountDeletionConfirmationRequired": "Refresh the page and enter the target user ID to confirm permanent deletion",
    "accountDeletionBusy": "This account has a transfer job or deletion in progress. Wait for it to finish, then retry.",
    "accountDeletionUnavailable": "Deletion is not complete. Please try again shortly.",
    "qqBindingExists": "This QQ account is already linked to a Toolbox account. Unlink it from the original account before linking it here. Contact an administrator if you cannot sign in to the original account.",
    "emailVerificationRequired": "Verify your email address before binding a social platform account",
    "codeInvalidOrExpired": "The verification code is invalid or has expired. Request a new code and try again.",
    "codeTooManyAttempts": "Too many verification attempts. Request a new code and try again.",
    "ticketClosed": "This ticket is closed and cannot receive replies. Open a new ticket for a new issue.",
    "ticketNotFound": "This ticket was not found; it may have been deleted. Go back to the ticket list and refresh.",
    "ticketQuotaExceeded": "You have reached the ticket limit. Wait for your existing tickets to be resolved before opening a new one.",
    "messageLength": "The message must be between 1 and 4000 characters. Adjust it and send again.",
    "captchaFailed": "The CAPTCHA check failed. Complete it again and retry.",
    "invalidVerificationCode": "The verification code is incorrect. Check it and enter it again.",
    "reauthRequired": "Re-enter your password to continue",
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
      "loadingFlow": "Loading…",
      "restartFlow": "Start again",
      "otherMethods": "Other ways",
      "triggerUnavailable": "Passkeys are not available right now. Use another method to continue.",
      "loadFlowFailed": "The {flow} has expired or cannot be reached. Start again.",
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
        "totpCode": "Authenticator code",
        "totpCodePlaceholder": "6-digit code",
        "lookupSecret": "Backup recovery code",
        "savePassword": "Save password",
        "continueWithCode": "Sign in with email code",
        "sendLink": "Send link",
        "verify": "Verify",
        "submit": "Submit",
        "next": "Next",
        "imageAlt": "Authenticator app QR code"
      },
      "text": {
        "1010001": "Sign in",
        "1010002": "Sign in with {provider}",
        "1010003": "Please confirm this action by verifying that it is you",
        "1010004": "Please complete the second authentication step",
        "1010005": "Verify",
        "1010006": "Authenticator code",
        "1010007": "Backup recovery code",
        "1010008": "Sign in with a security key",
        "1010009": "Use authenticator app",
        "1010010": "Use a backup recovery code",
        "1010011": "Sign in with a security key",
        "1010012": "Get your security key (USB key, fingerprint reader, …) ready and press Continue",
        "1010013": "Continue",
        "1010014": "A code was sent to the address you provided. If it doesn't arrive, check the address and try again.",
        "1010015": "Send sign-in code",
        "1010016": "You tried to sign in with {provider}, but the email {duplicateIdentifier} is already used by another account. Sign in to that account with one of the options below to add {provider} as another way to sign in.",
        "1010017": "Sign in and link",
        "1010018": "Confirm with {provider}",
        "1010019": "Request a code to continue",
        "1010020": "We will send a code to your address",
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
        "1040009": "Choose how you want to sign in to this account",
        "1050001": "Your changes have been saved",
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
        "1050024": "Please set up a second authentication factor to continue",
        "1060001": "You recovered your account. Please change your password or set up another sign-in method now.",
        "1060002": "We sent a password recovery email to the address you entered. Open the link in it; if it doesn't arrive, check your spam folder and make sure you used the address you signed up with.",
        "1060003": "We sent a recovery code to the address you entered. Enter it below; if it doesn't arrive, check your spam folder and make sure you used the address you signed up with.",
        "1060004": "A recovery code was sent to {masked_address}. If it doesn't arrive, check the address and make sure it is the one you signed up with.",
        "1060005": "Enter your full recovery address to recover access to your account",
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
        "1070015": "Please complete the captcha to continue",
        "1070016": "Recovery address",
        "1070017": "Phone number",
        "1070018": "Email or phone number",
        "1080001": "We sent a verification email to the address you entered. Open the link in it to finish; if it doesn't arrive, check your spam folder.",
        "1080002": "Your email address is verified",
        "1080003": "We sent a verification code to the address you entered. Enter it below; if it doesn't arrive, check your spam folder.",
        "1080004": "We sent a verification code by text message to the number you entered. If it doesn't arrive, check the number.",
        "1080005": "Your phone number is verified",
        "4000001": "This value is not valid. Please check it and try again.",
        "4000002": "Please fill in this field",
        "4000003": "Too short: enter at least {min_length} characters",
        "4000004": "The format is not valid. Please check it and try again.",
        "4000005": "This password can't be used. Please choose a different one.",
        "4000006": "The email or password is incorrect. Check them and try again, or use “Forgot password?” to reset it.",
        "4000007": "An account with this email already exists. Sign in instead, or use “Forgot password” to recover it.",
        "4000008": "The authentication code is incorrect. Enter the latest code from your authenticator.",
        "4000009": "No sign-in identifier was found. Enter your email and try again.",
        "4000010": "This account's email address is not verified yet. Please check your inbox and verify it first.",
        "4000011": "This account has no authenticator app set up",
        "4000012": "This backup recovery code has already been used. Please use another one.",
        "4000013": "This account has no security key set up",
        "4000014": "This account has no backup recovery codes set up",
        "4000015": "This account doesn't exist or has no security key set up",
        "4000016": "The backup recovery code is not valid. Please check it and try again.",
        "4000017": "Too long: enter at most {max_length} characters",
        "4000018": "The value must be at least {minimum}",
        "4000019": "The value must be greater than {minimum}",
        "4000020": "The value must be at most {maximum}",
        "4000021": "The value must be less than {maximum}",
        "4000022": "The value must be a multiple of {base}",
        "4000023": "Enter at most {max_items} items",
        "4000024": "Enter at least {min_items} items",
        "4000025": "Entries must not repeat",
        "4000026": "The value has the wrong type",
        "4000027": "An account with this email already exists. Sign in to it first, then link your social account.",
        "4000028": "{identifier} is already used by another account.",
        "4000029": "The value doesn't meet the requirements",
        "4000030": "The value doesn't meet the requirements",
        "4000031": "The password is too similar to your email. Please choose a different one.",
        "4000032": "The password is too short: use at least {min_length} characters",
        "4000033": "The password is too long: use at most {max_length} characters",
        "4000034": "This password has appeared in a known data breach and can't be used. Please choose a different one.",
        "4000035": "This account doesn't exist or hasn't turned on sign-in with a code",
        "4000036": "The details don't match what you entered before. Please start over.",
        "4000037": "This account doesn't exist or has no sign-in method set up",
        "4000038": "The captcha check failed. Please try again.",
        "4000039": "The new password must be different from your current one",
        "4000040": "Enter a valid email address",
        "4000041": "Enter a valid phone number",
        "4000042": "This account has no device key set up",
        "4000043": "The security key check failed. Please try again.",
        "4000044": "The device key signature is not valid",
        "4000045": "This device key can no longer be used. Please add it again.",
        "4000046": "This device key was added before user verification was supported and can no longer be used. Please add it again.",
        "4000047": "You need to accept this to continue",
        "4010001": "The sign-in page was open too long and has been refreshed. Please sign in again.",
        "4010002": "This sign-in request couldn't be processed. Check what you entered and try again.",
        "4010003": "This sign-up request couldn't be processed. Check what you entered and try again.",
        "4010004": "These settings couldn't be saved. Check what you entered and try again.",
        "4010005": "This recovery request couldn't be processed. Check what you entered and try again.",
        "4010006": "This verification request couldn't be processed. Check what you entered and try again.",
        "4010007": "This sign-in has already been completed and can't be submitted again. Please reload the page.",
        "4010008": "The sign-in code is invalid or has already been used. Please request a new one.",
        "4010009": "The linked sign-in methods don't match",
        "4010010": "The address you entered doesn't match any address on this account",
        "4010011": "This account has been disabled. Please contact the administrator.",
        "4040001": "The sign-up page was open too long and has been refreshed. Please fill it in again.",
        "4040002": "This sign-up has already been completed and can't be submitted again",
        "4040003": "The sign-up code is invalid or has already been used. Please request a new one.",
        "4050001": "The settings page was open too long and has been refreshed. Please try again.",
        "4050002": "You can only change one address at a time. Please update each address separately.",
        "4060001": "This recovery has already been completed and can't be submitted again",
        "4060002": "Account recovery ran into a problem. Please start over.",
        "4060003": "The link is missing its recovery token. Please start account recovery again.",
        "4060004": "The recovery link is invalid or has already been used. Please start account recovery again.",
        "4060005": "The recovery page was open too long and has been refreshed. Please try again.",
        "4060006": "The code is invalid or has already been used. Check it and try again, or resend the code.",
        "4070001": "The verification link is invalid or has already been used. Please send a new verification email.",
        "4070002": "This verification has already been completed and can't be submitted again",
        "4070003": "Verification ran into a problem. Please start over.",
        "4070004": "The link is missing its verification token. Please send a new verification email.",
        "4070005": "The verification page was open too long and has been refreshed. Please try again.",
        "4070006": "The code is invalid or has already been used. Check it and try again, or resend the code.",
        "5000001": "The sign-in service ran into an internal error. Please try again later.",
        "5000002": "No sign-in methods are available. Please contact the administrator.",
        "5000003": "Your organization requires single sign-on, but none is configured. Please contact the administrator."
      },
      "variants": {
        "requiredField": "Please enter your {field}",
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
        "noChanges": "There are no changes to save",
        "lookupRegenerateFirst": "Generate new backup recovery codes before confirming them",
        "lookupNone": "You don't have any backup recovery codes yet",
        "addressNotVerified": "This account's email address is not verified yet. Please check your inbox and verify it first.",
        "alreadySignedIn": "You are already signed in",
        "flowDisabled": "This feature is not available right now"
      },
      "errors": {
        "security_csrf_violation": "The security check failed, possibly because the page was open too long or used in several tabs at once. Please go back and start over; if it keeps happening, clear this site's cookies.",
        "security_identity_mismatch": "This request was started by a different account and was rejected. Please start over.",
        "session_already_available": "You are already signed in",
        "session_aal_already_fulfilled": "You have already completed the required verification",
        "session_aal1_required": "Please sign in before the second authentication step",
        "session_aal2_required": "This action needs the second authentication step. Please sign in again and complete it.",
        "session_inactive": "Your session has ended. Please sign in again.",
        "session_refresh_required": "To keep your account safe, please verify it is you before changing these settings",
        "session_verified_address_required": "Your email address is not verified yet. Please check your inbox and verify it first.",
        "self_service_flow_expired": "This page has expired. Please go back and start over.",
        "self_service_flow_disabled": "This feature is not available right now",
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
        "technicalDetails": "Technical details",
        "reasonLabel": "Reason"
      },
      "webauthn": {
        "unsupported": "This browser doesn't support passkeys or security keys. Please use a current version of Chrome, Edge, Safari or Firefox.",
        "notAllowed": "The request was cancelled or timed out. Please try again and confirm it in the system dialog.",
        "invalidState": "This passkey or security key has already been added",
        "aborted": "The request was cancelled",
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
      "description": "Sign in with your email and password",
      "title": "Sign in to Haruki Toolbox",
      "titleMfa": "Two-step verification",
      "titleRefresh": "Confirm it’s you",
      "otherMethods": "Other ways to sign in",
      "otherFactors": "Other ways to verify",
      "emailLabel": "Email",
      "emailPlaceholder": "name{'@'}example.com",
      "passwordLabel": "Password",
      "forgotPassword": "Forgot password?",
      "submit": "Sign in",
      "noAccount": "No account yet?",
      "registerLink": "Register",
      "refreshPasskey": {
        "mismatchTitle": "Verification did not complete",
        "mismatchDescription": "Your device did not return the account information, so the account could not be confirmed. Sign out and sign in again with your passkey to continue; no re-verification is needed for 15 minutes afterwards.",
        "relogin": "Sign out and sign in again",
        "reloginFailed": "Sign-out failed. Please try again."
      },
      "reasons": {
        "authRequired": "That page needs you to sign in. You return to it afterwards.",
        "adminRequired": "That page needs an administrator account. You return to it after signing in.",
        "sessionExpired": "Your session has expired. Sign in again to return to where you were."
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
      "description": "Create a Haruki Toolbox account",
      "title": "Register account",
      "usernameLabel": "Username",
      "emailLabel": "Email",
      "emailCodeLabel": "Email verification code",
      "emailCodePlaceholder": "Enter the code from your email",
      "passwordLabel": "Password",
      "sending": "Sending...",
      "countdown": "Retry in {seconds}s",
      "sendCode": "Send code",
      "submit": "Register",
      "hasAccount": "Already have an account?",
      "goLogin": "Sign in",
      "otherMethods": "Other ways to sign up"
    },
    "resetPassword": {
      "description": "Reset your account password",
      "title": "Reset password",
      "emailLabel": "Email",
      "newPasswordLabel": "New password",
      "confirmPasswordLabel": "Confirm password",
      "confirmPasswordPlaceholder": "Enter new password again",
      "submit": "Confirm reset"
    },
    "verification": {
      "description": "Verify your email to activate the account",
      "title": "Verify email",
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
      "retry": "Reload",
      "backToLogin": "Back to sign in",
      "backToHome": "Back to home",
      "alreadySignedInTitle": "You are already signed in",
      "missingIdDescription": "The link is incomplete. Go back to the sign-in page and start again.",
      "loadFailedDescription": "The error details could not be loaded. Check your connection and try again.",
      "fallbackDescription": "This step did not complete. Go back to the sign-in page and start again.",
      "errorIdLabel": "Error ID",
      "statusCodeLabel": "Status code",
      "detailsLabel": "Details"
    }
  },
  "sidebar": {
    "toggle": "Toggle sidebar",
    "title": "Navigation menu",
    "description": "Site navigation menu"
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
    "title": "Haruki Toolbox",
    "description": "Catalog, event math and personal data tools for Project SEKAI",
    "search": {
      "placeholder": "Search songs, cards, events"
    },
    "frequent": "Frequently used",
    "status": {
      "needsLogin": "Sign-in required",
      "needsData": "Upload your data first"
    },
    "account": {
      "label": "Current account",
      "guestTitle": "Three steps to your personal data tools",
      "steps": {
        "signIn": "Register and sign in",
        "bind": "Bind a game account",
        "upload": "Upload your data"
      }
    },
    "live": {
      "optInHint": "Load the game data to see the current event, limited gachas and new songs",
      "title": "On now",
      "optInTitle": "See what is on in the game",
      "load": "Load game data",
      "running": "Running",
      "upcoming": "Starting soon",
      "ended": "Ended",
      "endsIn": "{duration} left",
      "startsIn": "Starts in {duration}",
      "nextStartsIn": "Next event starts in {duration}",
      "duration": {
        "days": "{days}d {hours}h",
        "hours": "{hours}h {minutes}m",
        "minutes": "{minutes} min"
      },
      "eventDetail": "Event details",
      "eventCards": "Event cards",
      "gachas": "Limited gachas",
      "newSongs": "New songs",
      "none": "Nothing to show for this server right now",
      "error": "The game data failed to load. Try again later."
    },
    "trays": {
      "catalog": {
        "hint": "Reference for everything in the game"
      },
      "player": {
        "hint": "Your own account, once uploaded"
      },
      "event": {
        "hint": "Decks, points and rankings during an event"
      },
      "community": {
        "hint": "Find a room, a group, or us",
        "title": "Co-op and community"
      }
    },
    "tools": {
      "sponsors": "The people who keep the toolbox running",
      "about": "About the project and the team",
      "friendLinks": "Other useful SEKAI sites",
      "friendGroups": "Player group chats",
      "storyPlayer": "Read the game stories in your browser",
      "gachas": "Gacha banners and the cards in them",
      "events": "Past and current events with bonuses and rewards",
      "cards": "Cards, skills and artwork",
      "musicLibrary": "Songs, difficulties and release details",
      "training": "Training progress per character",
      "eventRecords": "Events you played and how you placed",
      "cardBox": "Card collection progress",
      "playerProfile": "Your in-game profile",
      "uploadData": "Sync your game account data to the toolbox",
      "deckRecommend": "Best event deck from your cards",
      "rankBorder": "Border lines and pace per tier",
      "ptCalculator": "Bonus, boost and score per game for a target pt",
      "eventPlanner": "Hour-by-hour play plan for the event",
      "musicProgress": "Song clears and rewards still available",
      "costumes": "Mix outfits, headwear and hair with a 3D preview",
      "sekaiStation": "Live co-op room numbers for the CN server",
      "tickets": "Report bugs, account issues or ideas"
    },
    "aboutBanner": {
      "desc": "About Project Haruki and how to sponsor it",
      "badge": "About & Support",
      "title": "Your support is our motivation to keep going"
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
      "guestDescription": "Sign in and bind a game account to upload data, view your profile and unlock personalized features",
      "onboarding": {
        "title": "Three steps to start",
        "step1": "Register and sign in",
        "step2": "Bind and verify your game account under “{link}”",
        "step2Link": "Game account management",
        "step3": "{link} your game data once with the iOS module / HarukiProxy",
        "step3Link": "Upload",
        "outro": "After that you can browse your cards, event records, deck recommendations and more"
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
      "optInHint": "Load the game database to show the ongoing event",
      "load": "Load current event",
      "none": "No event is currently running",
      "error": "Failed to load event info",
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
    "description": "Your card collection progress",
    "title": "My cards",
    "entryLink": "My cards",
    "noAccountHint": "Select or bind a game account first",
    "refresh": "Refresh",
    "loadError": "Failed to load your card collection data",
    "retry": "Retry",
    "unknownCharacter": "Unknown character",
    "empty": "No cards match the current view",
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
    "description": "Events you played and how you placed",
    "title": "Event records",
    "idle": "Select or bind a game account first",
    "loading": "Loading uploaded data and event data…",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view event records.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now",
    "uploadData": "Upload game data",
    "noData": "Your uploaded data has no event records yet",
    "noMatches": "No event records match the current filters",
    "hiddenByTime": "No event records in the last year; {count} older records are hidden",
    "showAll": "Show all",
    "loadFailed": "Failed to load event records",
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
      "empty": "Not enough records for a trend",
      "point": "Event PT",
      "rank": "Event rank",
      "showAll": "Show all",
      "rankPanel": "Event rank (higher on the chart is a better rank)",
      "allHidden": "Use the legend above to show the data again",
      "zoomHint": "Drag the selection to zoom into a range"
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
      "date": "Start date",
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
    "description": "Song clears and rewards still available",
    "title": "Music progress",
    "rewards": {
      "title": "Obtainable rewards",
      "hint": "Unclaimed score-rank and combo achievement rewards; any live mode counts",
      "unavailable": "Your upload has no achievement claim records; upload a complete data set to count rewards",
      "jewel": "Crystals",
      "coin": "Coins",
      "shard": "Shards",
      "scoreRank": "Score rank",
      "allClaimed": "All claimed"
    },
    "scoreRank": {
      "title": "Score rank rewards by song",
      "description": "Ranks are progressive (C → B → A → S): a higher rank also pays the lower ones, in any live mode",
      "summary": "Obtained: {obtained} · Remaining: {remaining} · {complete} / {total} songs complete",
      "totalHint": "Counts every song; the difficulty totals above count only songs with that chart",
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
      "empty": "No songs match",
      "showMore": "Show more ({count} left)"
    },
    "refresh": "Refresh",
    "retry": "Retry",
    "noAccount": "Select or bind a game account first",
    "loading": "Loading uploaded data and music data…",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view music progress.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now",
    "uploadData": "Upload game data",
    "noResults": "Your upload has no play results; every song shows as unplayed",
    "suiteError": "Failed to load music progress",
    "downloading": "Downloading game database ({progress}%)...",
    "overallTitle": "All difficulties",
    "levelsTitle": "Progress by level",
    "noSongs": "No songs exist for this difficulty on the selected server",
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
    "noMatches": "No songs match in this level",
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
    "description": "Search the game data and the site's pages",
    "placeholder": "Search by name, romaji, pinyin or ID",
    "loading": "Loading game data…",
    "loadFailed": "Some game data failed to load",
    "retry": "Retry",
    "empty": "No results",
    "groups": {
      "page": "Pages",
      "character": "Characters",
      "music": "Songs",
      "card": "Cards",
      "event": "Events",
      "gacha": "Gachas",
      "story": "Stories"
    },
    "scopes": {
      "label": "Search in",
      "all": "All"
    },
    "sections": {
      "recent": "Recently opened",
      "ongoing": "Ongoing events",
      "suggested": "Common pages",
      "clearRecent": "Clear"
    },
    "more": {
      "list": "View all {count} in {page}",
      "scope": "Show all {count}"
    },
    "meta": {
      "cardCount": "{count} cards",
      "episodes": "{count} episodes",
      "storyKind": {
        "unit": "Main story",
        "event": "Event story",
        "special": "Special story"
      }
    },
    "scopeHint": "Tab to switch scope",
    "footerRegion": "Data region: {region}"
  },
  "costumes": {
    "dressup": {
      "description": "Mix outfits, headwear and hair with a 3D preview",
      "title": "Costume dressup",
      "region": "Server",
      "character": "Character",
      "characterPlaceholder": "Select a character",
      "body": "Costume",
      "head": "Accessory",
      "hair": "Hairstyle",
      "partPlaceholder": "Select a part",
      "searchPlaceholder": "Search by name or ID...",
      "empty": "No matches found",
      "hairLockedHint": "This head piece comes with its own hairstyle; choosing a hairstyle takes it off",
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
      "loadError": "Failed to load costume data",
      "roleLoadError": "Failed to load the character's 3D part list",
      "retry": "Retry",
      "unit": "Unit version",
      "motion": "Motion",
      "motionSearch": "Search character, unit or motion…",
      "motionEmpty": "No motion found",
      "background": "Background",
      "accessoryOnly": "Accessory only",
      "accessoryOnlyHint": "Show the worn accessory on its own",
      "accessoryOnlyUnavailable": "The current head piece is not a separate accessory",
      "headExclusive": "Exclusive",
      "headExclusiveHint": "For this character only",
      "headHairStyle": "Hairstyle",
      "headHairStyleHint": "Only fits its own hairstyle",
      "filters": {
        "count": "{count} costumes",
        "source": "Source",
        "sources": {
          "card": "Card",
          "shop": "Costume shop",
          "initial": "Initial",
          "gacha": "Gacha",
          "pass": "Mission pass",
          "pack": "Costume pack",
          "event": "Event",
          "other": "Other"
        },
        "cardSupply": "Card type",
        "cardSupplies": {
          "all": "All",
          "normal": "Permanent",
          "limited": "Limited"
        },
        "origin": "Origin character",
        "year": "Year",
        "unknownYear": "Unknown",
        "regionExclusive": "Server exclusive",
        "regionExclusiveHint": "Costumes this server has and JP does not",
        "regionBadgeHint": "Server exclusive: {regions}"
      },
      "backgrounds": {
        "archive": "Game backdrop",
        "transparent": "Plain"
      },
      "motions": {
        "costume": "Showcase",
        "preview": "Generic",
        "result": "Live result",
        "follow": "Follow character",
        "followHint": "The current character and unit's showcase motion",
        "preview_ladies": "Generic · Female",
        "preview_mens": "Generic · Male"
      }
    },
    "viewer": {
      "loadError": "Failed to load the 3D model",
      "loadingProgress": "Downloading models {done}/{total} · {mb} MB",
      "loadingPrepare": "Preparing…",
      "retry": "Retry",
      "idle": "Select a costume to preview"
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
      "description": "Gacha banners and their rates",
      "title": "Gacha catalog",
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
      "cardEmpty": "No cards found",
      "removeCardFilter": "Remove card filter",
      "sortLabel": "Sort",
      "filtersTitle": "Filters",
      "resetFilters": "Reset filters",
      "total": "{total} gachas",
      "empty": "No gachas match the current filters"
    },
    "detail": {
      "back": "Back to gachas",
      "notFound": "This gacha (#{gachaId}) is not on the current server; try another server",
      "pickups": "Pickup members",
      "poolCards": "All cards in pool",
      "rates": "Rates",
      "rarity": "Rarity",
      "cardCount": "Cards",
      "baseRate": "Base rate",
      "guaranteedRate": "Guaranteed slot",
      "guaranteedNote": "The 10th pull of a 10-pull guarantees {rarity} or higher",
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
    "description": "Your in-game profile",
    "title": "My profile",
    "source": {
      "realtime": "Live data",
      "snapshot": "Uploaded data"
    },
    "noAccountHint": "Bind and select a game account to view your profile",
    "loadError": "Failed to load profile data",
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
      "title": "Music Clear Stats",
      "progress": "Progress",
      "total": "Total"
    },
    "headline": {
      "allPerfect": "All Perfect",
      "fullCombo": "Full Combo",
      "collection": "Cards collected",
      "challenge": "Best challenge live",
      "latestEvent": "Latest event rank"
    },
    "roster": {
      "title": "Characters",
      "rarityFilter": "Count the card collection by rarity",
      "otherUnit": "Other",
      "challenge": "Challenge"
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
    },
    "partialUpload": {
      "title": "These sections need uploaded game data",
      "description": "Card collection, challenge live and the event point trend come from your uploaded account data (Suite)"
    }
  },
  "training": {
    "layout": {
      "description": "Training progress per character",
      "title": "Character training",
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
      "noAccountHint": "Bind and select a game account to view challenge live info",
      "loadError": "Failed to load challenge live data",
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
      "noAccountHint": "Bind and select a game account to view power bonuses",
      "loadError": "Failed to load power bonus data",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "sharedAreaTitle": "Area items for all characters",
      "allCharacterBonus": "All-character base bonus",
      "multiUnitBonus": "Conditional multi-unit bonus",
      "sharedAreaHint": "The all-character bonus is already in each character below; whether the multi-unit bonus applies depends on the deck",
      "charactersTitle": "Character Bonuses",
      "unitsTitle": "Unit Bonuses",
      "attrsTitle": "Attribute Bonuses",
      "rankBonus": "Rank",
      "areaItemBonus": "Area item",
      "fixtureBonus": "MYSEKAI fixtures",
      "gateBonus": "MYSEKAI gate",
      "total": "Total",
      "characterColumn": "Character",
      "unitColumn": "Unit",
      "attrColumn": "Attribute",
      "gateHint": "VIRTUAL SINGER uses your highest owned gate; cards with a support unit use that unit’s gate",
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
      "noAccountHint": "Bind and select a game account to view bonds",
      "loadError": "Failed to load bond data",
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
      "description": "Bonus and materials per level",
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
      "showAll": "All levels",
      "materialsLegend": "Materials: have / need",
      "materialEnough": "Enough",
      "materialShort": "Not enough"
    },
    "leader": {
      "title": "Leader counts",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load leader statistics",
      "noAccountHint": "Bind and select a game account to view leader statistics",
      "limit": "Mission cap {count}",
      "exLimit": "EX cap {count}",
      "sortByTotal": "By count",
      "sortByCharacter": "By character",
      "normalLabel": "Normal",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "Unknown character"
    },
    "missions": {
      "title": "Character Missions",
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
      "eventRankingTools": "Event ranking tools",
      "projectSekai": "Project SEKAI tools",
      "accountManagement": "Account & management",
      "harukiBot": "HarukiBot",
      "sekaiCatalog": "Sekai catalog",
      "sekaiPlayer": "My game data"
    },
    "items": {
      "friendGroups": "Recommended groups",
      "friendLinks": "Friend links",
      "sponsors": "Sponsors",
      "deckRecommend": "Deck recommendation",
      "eventPlanner": "Event planner",
      "rankBorder": "Rank border",
      "about": "About",
      "ptCalculator": "Score control",
      "uploadData": "Upload data",
      "sekaiStation": "Sekai Station",
      "botNeoRegistration": "HarukiBot NEO registration",
      "musicLibrary": "Music catalog",
      "cards": "Card catalog",
      "events": "Event catalog",
      "cardBox": "My cards",
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
    "scrollJump": {
      "top": "Back to top",
      "bottom": "Jump to bottom"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. All rights reserved.",
      "privacyPolicy": "Privacy Policy",
      "termsOfService": "Terms of Service",
      "legalLinks": "Legal links",
      "unofficialNotice": "Haruki Toolbox is not affiliated with, authorized by, endorsed by, or officially partnered with SEGA / Colorful Palette",
      "assetCopyright": "Related game assets are copyright SEGA / Colorful Palette",
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
    "deckRecommend": "Deck recommendation",
    "rankBorder": "Rank border",
    "rankBorderDetail": "Rank border detail",
    "ptCalculator": "Score control",
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
    "userIdentityMfaSettings": "Two-step verification",
    "userIdentitySocialSettings": "Social login settings",
    "userIdentitySessionSettings": "Signed-in devices",
    "gameAccountBindings": "Game account management",
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
      "box": "My cards"
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
      "description": "Songs, difficulties and release details",
      "title": "Music library",
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
        "empty": "No songs match the current filters",
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
      "notFound": "This song (#{musicId}) is not on the current server; try another server",
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
      "vocalsEmpty": "No vocal versions available",
      "play": "Play",
      "pause": "Pause",
      "chartPreview": {
        "title": "Chart Preview",
        "modeDynamic": "Dynamic",
        "modeStatic": "Static",
        "loadError": "Failed to load the chart",
        "retry": "Retry",
        "seek": "Playback position",
        "speed": "Note speed",
        "zoomFit": "Fit height",
        "zoom": "Zoom level",
        "silent": "No audio found; playing silently"
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
      "description": "Cards, skills and artwork",
      "title": "Card catalog",
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
      "notFound": "This card (#{cardId}) is not on the current server; try another server",
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
      "relatedEventsEmpty": "No related events",
      "relatedGachas": "Related gachas",
      "relatedGachasEmpty": "No related gachas",
      "costumes": "Costumes",
      "costumeDressup": "Costume dressup",
      "costumePreviewHint": "3D preview",
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
      "description": "Past and current events with bonuses and rewards",
      "title": "Event catalog",
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
      "loadFailed": "Failed to load event data",
      "retry": "Retry",
      "empty": "No events match the current filters"
    },
    "detail": {
      "back": "Back to event catalog",
      "loadFailed": "Failed to load event data",
      "retry": "Retry",
      "notFound": "This event (#{eventId}) is not on the current server; try another server",
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
      "bonusEmpty": "No bonus data for this event",
      "bonusAttrOnly": "All {attr} cards",
      "chaptersTitle": "World Link chapters",
      "chapterLabel": "Chapter {no}",
      "chapterFinale": "Finale",
      "cardsTitle": "Event cards",
      "cardsEmpty": "No cards for this event",
      "links": {
        "rankBorder": "View rank border",
        "deckRecommend": "View deck recommendation",
        "story": "Play story"
      }
    }
  },
  "musicPlayer": {
    "label": "Music player",
    "play": "Play",
    "pause": "Pause",
    "seek": "Playback position",
    "vocal": "Switch vocal version",
    "vocalsTitle": "Vocal versions (switching keeps the song playing)",
    "volume": "Volume",
    "mute": "Mute",
    "unmute": "Unmute",
    "close": "Close the player",
    "openSong": "Open the song page",
    "error": "The audio failed to load. Please try again later.",
    "singerSeparator": ", ",
    "playSong": "Play {title}",
    "nowPlaying": "Now playing"
  },
  "homeSettings": {
    "title": "Haruki Toolbox Settings",
    "description": "Routes, appearance, language and data caches",
    "trigger": "Settings",
    "tabs": {
      "preferences": "Preferences",
      "app": "App",
      "sekaiData": "Game database",
      "userData": "User data"
    },
    "resetDialog": {
      "title": "Reset preferences?",
      "description": "Routes, appearance, language, low effects, privacy and playback preferences go back to their defaults",
      "confirm": "Reset preferences"
    },
    "endpoint": {
      "label": "Server route",
      "help": "Try CDN if access from abroad is unstable",
      "placeholder": "Select a route",
      "direct": "Direct",
      "cdn": "CDN",
      "unavailable": "No server routes are configured in this environment",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms",
      "refreshLatency": "Re-test latency"
    },
    "assetEndpoint": {
      "label": "Asset route",
      "help": "Where card art and audio load from; the fastest is picked on your first visit",
      "placeholder": "Select a route",
      "global": "Overseas",
      "chinaCdn": "Mainland China (Tencent Cloud)",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "Appearance",
      "placeholder": "Select theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "locale": {
      "label": "Language",
      "placeholder": "Select language",
      "zhCN": "简体中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "Low effects mode",
      "help": "Turns off glass blur and shadows to save power"
    },
    "privacy": {
      "hideGameUserIdLabel": "Hide game UID",
      "hideGameUserIdHelp": "Shows only the first 2 and last 4 digits"
    },
    "unreleased": {
      "showLabel": "Show unreleased content",
      "blurLabel": "Spoiler blur for unreleased content"
    },
    "appUpdate": {
      "title": "App update",
      "installedTitle": "Installed version",
      "current": "Current",
      "available": "Update available",
      "remoteVersion": "Remote version",
      "remoteCommit": "Remote Git commit",
      "remoteBuildTime": "Remote build time",
      "checkedAt": "Last checked: {time}",
      "lastError": "Check failed. Try again later.",
      "notCheckedYet": "Not checked yet",
      "check": "Check for updates",
      "checking": "Checking...",
      "update": "Update app",
      "updating": "Updating..."
    },
    "userData": {
      "refreshHint": "Checks the server for a newer upload; a profile is fetched live from the game server",
      "groups": {
        "source": "Data to manage",
        "cache": "Cache status"
      },
      "account": "Account",
      "accountPlaceholder": "Select a bound account",
      "noAccount": "No game account bound yet",
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
        "description": "Clears this account's user data cached in this browser. It will need to be downloaded again.",
        "confirm": "Clear cache"
      },
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
    "groups": {
      "appearance": "Appearance",
      "network": "Network",
      "privacy": "Privacy & content",
      "music": "Music playback",
      "reset": "Reset"
    },
    "reset": {
      "label": "Restore default settings"
    },
    "music": {
      "preferredVocal": {
        "label": "Preferred vocal version",
        "options": {
          "sekai": "SEKAI version",
          "original": "Original song"
        }
      }
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
      "forbidden": "You do not have permission to access this content. If you think that is a mistake, contact an administrator.",
      "unexpectedPayload": "The server returned data in an unexpected format. Reload to try again; if it keeps happening, contact an administrator.",
      "detail": "Details: {detail}"
    },
    "loadError": {
      "title": "Failed to load",
      "description": "Check your connection and try again",
      "retry": "Retry"
    },
    "sync": {
      "successTitle": "Settings synced",
      "failedTitle": "Settings sync unavailable",
      "failedDescription": "Cloud settings could not be synced. Try again later.",
      "missingUpdatedDataDescription": "The cloud settings response was incomplete. Refresh the page and try again.",
      "unexpectedStatusDescription": "Cloud settings request returned an unexpected status ({status})"
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
      "title": "Open in your browser",
      "descriptionApp": "The toolbox does not work in the web view built into {app}. Open it in your browser instead.",
      "descriptionGeneric": "The toolbox does not work in an app’s built-in web view. Open it in your browser instead.",
      "stepsTitle": "How to switch to your browser",
      "stepMenu": "Tap the {icon} button in the top-right corner",
      "stepMenuAnywhere": "Find the page’s menu or share button, usually shown as {icon}",
      "cornerLabel": "The button is just above here",
      "copyFirstTitle": "Copy the link and open it in your browser",
      "menuAltTitle": "Or switch from the menu",
      "menuAltTitleApp": "Or switch from inside {app}",
      "stepOpenIos": "Choose “Open in Safari” or “Open in browser”",
      "stepOpenAndroid": "Choose “Open in browser” or a similar option",
      "stepDone": "The page reopens in your browser. Keep using it there.",
      "fallbackTitle": "No such option?",
      "fallbackBody": "Copy the link below and paste it into your browser’s address bar. We recommend {browsers}.",
      "browsers": {
        "ios": "Safari or Chrome",
        "android": "Chrome or your phone’s browser",
        "other": "Chrome, Edge, Firefox or Safari"
      },
      "linkLabel": "Page link",
      "copyLink": "Copy link",
      "copied": "Copied. Paste it into your browser to open.",
      "copyFailed": "Could not copy. Press and hold the link above to copy it.",
      "deviceHint": "To authorize a device, open this link in your browser, then type the code shown on your device",
      "apps": {
        "wechat": "WeChat",
        "qq": "QQ",
        "weibo": "Weibo",
        "dingtalk": "DingTalk",
        "alipay": "Alipay",
        "douyin": "Douyin",
        "tiktok": "TikTok"
      }
    },
    "pwa": {
      "updateAvailableTitle": "New version available",
      "updateAvailableDescriptionWithVersion": "Version {version}",
      "updateAction": "Update app",
      "laterAction": "Later",
      "applyingTitle": "Updating app",
      "applyingDescription": "The page reloads when it is done",
      "currentTitle": "App is up to date",
      "checkFailedTitle": "Update check failed",
      "checkFailedDescription": "Try again later",
      "offlineReadyTitle": "Offline cache ready",
      "devTitle": "Development mode",
      "devDescription": "PWA updates are not registered in development mode",
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
      "sheetDescription": "Adjust the filters; the results update immediately",
    },
    "results": {
      "count": "{count} results",
      "empty": "Nothing matches the current filters",
      "loadError": "Failed to load data",
      "retry": "Retry",
      "downloading": "Downloading game data… {progress}%",
      "offline": "Offline data",
      "offlineHint": "Locally cached game data; may not be the latest"
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
      "upcomingHidden": "Upcoming content is hidden",
      "showUnreleased": "Show unreleased content",
      "endsIn": "{time} left",
      "startsIn": "Starts in {time}",
      "permanent": "Permanent",
      "tbd": "TBD"
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
      "notFound": "Not on the current server; try another server",
      "loadError": "Failed to load details",
      "assetName": "Internal name",
      "copyAssetName": "Copy internal name",
      "assetNameCopied": "Internal name copied",
      "period": "Period",
      "viewAllCount": "View all ({count})",
      "zoom": "View full size",
      "showMore": "Show more",
      "showLess": "Show less"
    },
    "lightbox": {
      "description": "Image viewer",
      "openInNewTab": "Open in new tab",
      "items": "Images",
      "tools": "Image tools",
      "loading": "Loading the image…",
      "loadFailed": "The image failed to load. You can open the original in a new tab.",
      "rotateLeft": "Rotate 90° counter-clockwise",
      "rotateRight": "Rotate 90° clockwise",
      "flipHorizontal": "Mirror left to right",
      "flipVertical": "Mirror top to bottom",
      "crop": "Crop",
      "applyCrop": "Apply crop",
      "cropAspect": "Crop shape",
      "cropFree": "Free",
      "undo": "Undo the last step",
      "redo": "Redo",
      "reset": "Back to the original",
      "saveOriginal": "Save original",
      "export": "Export",
      "apply": "Apply",
      "done": "Done",
      "moveSelection": "Move selection",
      "resizeSelection": "Resize selection",
      "moveText": "Move text",
      "resetValue": "Reset to 0",
      "straighten": "Straighten",
      "angle": "Angle",
      "adjust": "Adjust",
      "adjustments": {
        "brightness": "Brightness",
        "contrast": "Contrast",
        "saturation": "Saturation",
        "temperature": "Warmth"
      },
      "look": "Look",
      "looks": {
        "none": "None",
        "grayscale": "B&W",
        "sepia": "Sepia",
        "invert": "Invert"
      },
      "mask": "Mask",
      "maskKind": "Mask style",
      "maskKinds": {
        "pixelate": "Mosaic",
        "blur": "Blur"
      },
      "strength": "Strength",
      "draw": "Draw",
      "drawTool": "Drawing tool",
      "drawTools": {
        "pen": "Pen",
        "arrow": "Arrow",
        "rect": "Rectangle",
        "ellipse": "Ellipse"
      },
      "color": "Color",
      "colors": {
        "red": "Red",
        "yellow": "Yellow",
        "green": "Green",
        "blue": "Blue",
        "white": "White",
        "black": "Black"
      },
      "lineWidth": "Line width",
      "lineWidths": {
        "small": "Thin",
        "medium": "Medium",
        "large": "Thick"
      },
      "text": "Text",
      "textPlaceholder": "Enter text",
      "textSize": "Text size",
      "textStyle": "Style",
      "bold": "Bold",
      "italic": "Italic",
      "textAlign": "Alignment",
      "textAligns": {
        "left": "Align left",
        "center": "Center",
        "right": "Align right"
      },
      "textFont": "Font",
      "textFonts": {
        "sans": "Sans",
        "serif": "Serif",
        "mono": "Mono"
      },
      "textEffect": "Effect",
      "textEffects": {
        "outline": "Outline",
        "plate": "Plate",
        "none": "None"
      },
      "textRotation": "Rotate",
      "exportFormat": "Format",
      "exportQuality": "Quality",
      "exportSize": "Size",
      "exportFailed": "Export failed",
      "zoom": "Zoom",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "zoomReset": "Fit to screen"
    },
    "time": {
      "localLabel": "Local time",
      "serverLabel": "{region} server time",
      "localTime": "Your time: {time}",
      "switchLabel": "Time zone for these times",
      "serverTime": "{region} server time: {time}",
      "hint": "Shown in your time zone ({zone}); {region} server time is {serverZone}",
      "sameZone": "Your time zone ({zone}) matches the {region} server"
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
